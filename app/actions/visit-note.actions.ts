"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, canAccessProviderData } from "@/lib/auth-helpers";
import { visitNoteService } from "@/lib/services/visit-note.service";
import { appointmentService } from "@/lib/services/appointment.service";
import {
  createVisitNoteSchema,
  updateVisitNoteSchema,
  getVisitNoteSchema,
  getVisitNoteByAppointmentSchema,
  getVisitNoteHistorySchema,
  type CreateVisitNoteInput,
  type UpdateVisitNoteInput,
  type GetVisitNoteInput,
  type GetVisitNoteByAppointmentInput,
  type GetVisitNoteHistoryInput,
} from "@/lib/validations/visit-note";

/**
 * Visit Note Server Actions
 * 
 * Handles authorization and delegates business logic to service layer
 * Enforces author-only edit permissions
 * 
 * Authorization Rules:
 * - PROVIDER: Can create notes for own appointments only
 * - PROVIDER: Can edit only notes they authored
 * - FRONT_DESK: Cannot create or edit visit notes (clinical staff only)
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Create a new visit note
 * 
 * Only the appointment's provider can create the visit note
 */
export async function createVisitNote(
  input: CreateVisitNoteInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Only providers can create visit notes
    if (session.user.role !== "PROVIDER") {
      return {
        success: false,
        error: "Only providers can create visit notes",
      };
    }

    if (!session.user.providerId) {
      return {
        success: false,
        error: "Provider ID not found in session",
      };
    }

    // Validate input
    const validatedInput = createVisitNoteSchema.parse(input);

    // Get appointment to verify provider ownership
    const appointment = await appointmentService.getAppointmentById(
      validatedInput.appointmentId
    );

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Verify this is the provider's appointment
    if (appointment.providerId !== session.user.providerId) {
      return {
        success: false,
        error: "You can only create visit notes for your own appointments",
      };
    }

    // Create visit note
    const visitNote = await visitNoteService.createVisitNote({
      appointmentId: validatedInput.appointmentId,
      authorId: session.user.id,
      chiefComplaint: validatedInput.chiefComplaint,
      historyOfPresent: validatedInput.historyOfPresent,
      physicalExam: validatedInput.physicalExam,
      assessment: validatedInput.assessment,
      plan: validatedInput.plan,
      bloodPressure: validatedInput.bloodPressure,
      heartRate: validatedInput.heartRate,
      temperature: validatedInput.temperature,
      respiratoryRate: validatedInput.respiratoryRate,
      oxygenSaturation: validatedInput.oxygenSaturation,
      weight: validatedInput.weight,
      height: validatedInput.height,
      prescriptions: validatedInput.prescriptions,
      labOrders: validatedInput.labOrders,
      imagingOrders: validatedInput.imagingOrders,
      referrals: validatedInput.referrals,
      followUpInstructions: validatedInput.followUpInstructions,
      nextVisitDate: validatedInput.nextVisitDate,
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${validatedInput.appointmentId}`);

    return { success: true, data: { id: visitNote.id } };
  } catch (error) {
    console.error("createVisitNote error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to create visit note" };
  }
}

/**
 * Update an existing visit note
 * 
 * Only the original author can edit their notes
 * Creates immutable history snapshot automatically
 */
export async function updateVisitNote(
  input: UpdateVisitNoteInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Only providers can update visit notes
    if (session.user.role !== "PROVIDER") {
      return {
        success: false,
        error: "Only providers can update visit notes",
      };
    }

    // Validate input
    const validatedInput = updateVisitNoteSchema.parse(input);

    // Check if user is the author
    const canEdit = await visitNoteService.canEditVisitNote(
      validatedInput.visitNoteId,
      session.user.id
    );

    if (!canEdit) {
      return {
        success: false,
        error: "You can only edit visit notes you authored",
      };
    }

    // Update visit note (history snapshot created automatically)
    const visitNote = await visitNoteService.updateVisitNote(
      validatedInput.visitNoteId,
      session.user.id,
      {
        changeReason: validatedInput.changeReason,
        chiefComplaint: validatedInput.chiefComplaint,
        historyOfPresent: validatedInput.historyOfPresent,
        physicalExam: validatedInput.physicalExam,
        assessment: validatedInput.assessment,
        plan: validatedInput.plan,
        bloodPressure: validatedInput.bloodPressure,
        heartRate: validatedInput.heartRate,
        temperature: validatedInput.temperature,
        respiratoryRate: validatedInput.respiratoryRate,
        oxygenSaturation: validatedInput.oxygenSaturation,
        weight: validatedInput.weight,
        height: validatedInput.height,
        prescriptions: validatedInput.prescriptions,
        labOrders: validatedInput.labOrders,
        imagingOrders: validatedInput.imagingOrders,
        referrals: validatedInput.referrals,
        followUpInstructions: validatedInput.followUpInstructions,
        nextVisitDate: validatedInput.nextVisitDate,
      }
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${visitNote.appointmentId}`);

    return { success: true, data: { id: visitNote.id } };
  } catch (error) {
    console.error("updateVisitNote error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to update visit note" };
  }
}

/**
 * Get visit note by ID
 */
export async function getVisitNote(
  input: GetVisitNoteInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = getVisitNoteSchema.parse(input);

    // Get visit note
    const visitNote = await visitNoteService.getVisitNoteById(
      validatedInput.visitNoteId
    );

    if (!visitNote) {
      return { success: false, error: "Visit note not found" };
    }

    // Check authorization
    const canAccess = await canAccessProviderData(
      visitNote.appointment.provider.id
    );

    if (!canAccess) {
      return {
        success: false,
        error: "You do not have permission to view this visit note",
      };
    }

    return { success: true, data: visitNote };
  } catch (error) {
    console.error("getVisitNote error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to get visit note" };
  }
}

/**
 * Get visit note by appointment ID
 */
export async function getVisitNoteByAppointment(
  input: GetVisitNoteByAppointmentInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = getVisitNoteByAppointmentSchema.parse(input);

    // Get appointment to check authorization
    const appointment = await appointmentService.getAppointmentById(
      validatedInput.appointmentId
    );

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Check authorization
    const canAccess = await canAccessProviderData(appointment.providerId);

    if (!canAccess) {
      return {
        success: false,
        error: "You do not have permission to view this visit note",
      };
    }

    // Get visit note
    const visitNote = await visitNoteService.getVisitNoteByAppointmentId(
      validatedInput.appointmentId
    );

    return { success: true, data: visitNote };
  } catch (error) {
    console.error("getVisitNoteByAppointment error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to get visit note" };
  }
}

/**
 * Get complete history for a visit note
 * 
 * Returns all historical versions (immutable)
 */
export async function getVisitNoteHistory(
  input: GetVisitNoteHistoryInput
): Promise<ActionResult<any[]>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = getVisitNoteHistorySchema.parse(input);

    // Get visit note to check authorization
    const visitNote = await visitNoteService.getVisitNoteById(
      validatedInput.visitNoteId
    );

    if (!visitNote) {
      return { success: false, error: "Visit note not found" };
    }

    // Check authorization
    const canAccess = await canAccessProviderData(
      visitNote.appointment.provider.id
    );

    if (!canAccess) {
      return {
        success: false,
        error: "You do not have permission to view this history",
      };
    }

    // Get history
    const history = await visitNoteService.getVisitNoteHistory(
      validatedInput.visitNoteId
    );

    return { success: true, data: history };
  } catch (error) {
    console.error("getVisitNoteHistory error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to get visit note history" };
  }
}
