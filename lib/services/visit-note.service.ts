import { prisma } from "@/lib/prisma";
import type { VisitNote, VisitNoteHistory, Prisma } from "@prisma/client";

/**
 * Visit Note Service Layer
 * 
 * Handles all business logic for visit note management
 * Implements immutable history tracking for compliance and audit
 * 
 * Key Features:
 * - Automatic history snapshots on every edit
 * - Author-only edit permissions (enforced at action layer)
 * - Complete audit trail
 * - HIPAA-compliant immutable records
 */

export class VisitNoteService {
  /**
   * Create a new visit note
   * 
   * Creates initial version and records creation in history
   */
  async createVisitNote(
    input: {
      appointmentId: string;
      authorId: string;
      chiefComplaint?: string;
      historyOfPresent?: string;
      physicalExam?: string;
      assessment?: string;
      plan?: string;
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      prescriptions?: string;
      labOrders?: string;
      imagingOrders?: string;
      referrals?: string;
      followUpInstructions?: string;
      nextVisitDate?: Date;
    }
  ): Promise<VisitNote> {
    // Check if visit note already exists for this appointment
    const existing = await prisma.visitNote.findUnique({
      where: { appointmentId: input.appointmentId },
    });

    if (existing) {
      throw new Error("Visit note already exists for this appointment");
    }

    // Create visit note
    const visitNote = await prisma.visitNote.create({
      data: {
        appointmentId: input.appointmentId,
        authorId: input.authorId,
        chiefComplaint: input.chiefComplaint,
        historyOfPresent: input.historyOfPresent,
        physicalExam: input.physicalExam,
        assessment: input.assessment,
        plan: input.plan,
        bloodPressure: input.bloodPressure,
        heartRate: input.heartRate,
        temperature: input.temperature,
        respiratoryRate: input.respiratoryRate,
        oxygenSaturation: input.oxygenSaturation,
        weight: input.weight,
        height: input.height,
        prescriptions: input.prescriptions,
        labOrders: input.labOrders,
        imagingOrders: input.imagingOrders,
        referrals: input.referrals,
        followUpInstructions: input.followUpInstructions,
        nextVisitDate: input.nextVisitDate,
        lastEditedBy: input.authorId,
        lastEditedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
        appointment: {
          select: {
            id: true,
            patient: true,
          },
        },
      },
    });

    // Create initial history entry
    await this.createHistorySnapshot(
      visitNote.id,
      input.authorId,
      "Initial creation"
    );

    return visitNote;
  }

  /**
   * Update a visit note
   * 
   * Creates immutable history snapshot before updating
   * Only the author can edit their own notes (enforced at action layer)
   */
  async updateVisitNote(
    visitNoteId: string,
    editorId: string,
    updates: {
      changeReason?: string;
      chiefComplaint?: string;
      historyOfPresent?: string;
      physicalExam?: string;
      assessment?: string;
      plan?: string;
      bloodPressure?: string;
      heartRate?: number;
      temperature?: number;
      respiratoryRate?: number;
      oxygenSaturation?: number;
      weight?: number;
      height?: number;
      prescriptions?: string;
      labOrders?: string;
      imagingOrders?: string;
      referrals?: string;
      followUpInstructions?: string;
      nextVisitDate?: Date | null;
    }
  ): Promise<VisitNote> {
    // Get current visit note
    const currentNote = await prisma.visitNote.findUnique({
      where: { id: visitNoteId },
    });

    if (!currentNote) {
      throw new Error("Visit note not found");
    }

    // Create immutable history snapshot BEFORE updating
    await this.createHistorySnapshot(
      visitNoteId,
      editorId,
      updates.changeReason || "Updated"
    );

    // Update visit note
    const updatedNote = await prisma.visitNote.update({
      where: { id: visitNoteId },
      data: {
        chiefComplaint: updates.chiefComplaint,
        historyOfPresent: updates.historyOfPresent,
        physicalExam: updates.physicalExam,
        assessment: updates.assessment,
        plan: updates.plan,
        bloodPressure: updates.bloodPressure,
        heartRate: updates.heartRate,
        temperature: updates.temperature,
        respiratoryRate: updates.respiratoryRate,
        oxygenSaturation: updates.oxygenSaturation,
        weight: updates.weight,
        height: updates.height,
        prescriptions: updates.prescriptions,
        labOrders: updates.labOrders,
        imagingOrders: updates.imagingOrders,
        referrals: updates.referrals,
        followUpInstructions: updates.followUpInstructions,
        nextVisitDate: updates.nextVisitDate,
        lastEditedBy: editorId,
        lastEditedAt: new Date(),
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
        lastEditor: {
          select: {
            id: true,
            email: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
        appointment: {
          select: {
            id: true,
            patient: true,
          },
        },
      },
    });

    return updatedNote;
  }

  /**
   * Get visit note by ID
   */
  async getVisitNoteById(visitNoteId: string): Promise<VisitNote | null> {
    return prisma.visitNote.findUnique({
      where: { id: visitNoteId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
        lastEditor: {
          select: {
            id: true,
            email: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            patient: true,
            provider: true,
          },
        },
      },
    });
  }

  /**
   * Get visit note by appointment ID
   */
  async getVisitNoteByAppointmentId(
    appointmentId: string
  ): Promise<VisitNote | null> {
    return prisma.visitNote.findUnique({
      where: { appointmentId },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
        lastEditor: {
          select: {
            id: true,
            email: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            patient: true,
            provider: true,
          },
        },
      },
    });
  }

  /**
   * Get complete history for a visit note
   * 
   * Returns all historical versions in reverse chronological order
   * IMMUTABLE - history records cannot be modified or deleted
   */
  async getVisitNoteHistory(visitNoteId: string): Promise<VisitNoteHistory[]> {
    return prisma.visitNoteHistory.findMany({
      where: { visitNoteId },
      include: {
        editor: {
          select: {
            id: true,
            email: true,
            provider: {
              select: {
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { editedAt: "desc" },
    });
  }

  /**
   * Create an immutable history snapshot
   * 
   * PRIVATE METHOD - automatically called on create/update
   * Records complete state of visit note at point in time
   */
  private async createHistorySnapshot(
    visitNoteId: string,
    editorId: string,
    changeReason: string
  ): Promise<void> {
    const currentNote = await prisma.visitNote.findUnique({
      where: { id: visitNoteId },
    });

    if (!currentNote) {
      throw new Error("Visit note not found");
    }

    // Create immutable history record
    await prisma.visitNoteHistory.create({
      data: {
        visitNoteId,
        editedBy: editorId,
        changeReason,
        chiefComplaint: currentNote.chiefComplaint,
        historyOfPresent: currentNote.historyOfPresent,
        physicalExam: currentNote.physicalExam,
        assessment: currentNote.assessment,
        plan: currentNote.plan,
        bloodPressure: currentNote.bloodPressure,
        heartRate: currentNote.heartRate,
        temperature: currentNote.temperature,
        respiratoryRate: currentNote.respiratoryRate,
        oxygenSaturation: currentNote.oxygenSaturation,
        weight: currentNote.weight,
        height: currentNote.height,
        prescriptions: currentNote.prescriptions,
        labOrders: currentNote.labOrders,
        imagingOrders: currentNote.imagingOrders,
        referrals: currentNote.referrals,
        followUpInstructions: currentNote.followUpInstructions,
        nextVisitDate: currentNote.nextVisitDate,
      },
    });
  }

  /**
   * Check if user can edit visit note
   * 
   * Only the original author can edit their notes
   */
  async canEditVisitNote(visitNoteId: string, userId: string): Promise<boolean> {
    const visitNote = await prisma.visitNote.findUnique({
      where: { id: visitNoteId },
      select: { authorId: true },
    });

    if (!visitNote) {
      return false;
    }

    return visitNote.authorId === userId;
  }
}

// Singleton instance
export const visitNoteService = new VisitNoteService();
