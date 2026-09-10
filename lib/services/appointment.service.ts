import { prisma } from "@/lib/prisma";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  HistoryAction,
} from "@prisma/client";
import {
  AppointmentNotFoundError,
  InvalidTransitionError,
} from "@/lib/errors/appointment-errors";
import { availabilityService } from "./availability.service";

/**
 * Appointment Service Layer
 * 
 * Handles all business logic for appointment management
 * Enforces state machine transitions and business rules
 * Separated from authorization - call with pre-authorized data
 */

export class AppointmentService {
  /**
   * Valid state transitions for appointment status
   */
  private readonly VALID_TRANSITIONS: Record<
    AppointmentStatus,
    AppointmentStatus[]
  > = {
    REQUESTED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
    CHECKED_IN: ["COMPLETED", "CANCELLED"],
    COMPLETED: [], // Terminal state
    NO_SHOW: [], // Terminal state
    CANCELLED: [], // Terminal state
  };

  /**
   * Create a new appointment in REQUESTED status
   * 
   * @throws Error if provider is not available at the requested time
   */
  async createAppointment(
    input: {
      patientId: string;
      providerId: string;
      scheduledAt: Date;
      duration: number;
      type: AppointmentType;
      reason: string;
      notes?: string;
    },
    performedBy: string
  ): Promise<Appointment> {
    // Check provider availability
    const isAvailable = await availabilityService.isProviderAvailable(
      input.providerId,
      input.scheduledAt,
      input.duration
    );

    if (!isAvailable) {
      throw new Error(
        "Provider is not available at the requested time. Please check their availability and choose a different time slot."
      );
    }

    // Check for scheduling conflicts
    const hasConflict = await this.hasSchedulingConflict(
      input.providerId,
      input.scheduledAt,
      input.duration
    );

    if (hasConflict) {
      throw new Error(
        "This time slot conflicts with an existing appointment. Please choose a different time."
      );
    }

    // Create appointment in REQUESTED status
    const appointment = await prisma.appointment.create({
      data: {
        patientId: input.patientId,
        providerId: input.providerId,
        scheduledAt: input.scheduledAt,
        duration: input.duration,
        type: input.type,
        status: "REQUESTED",
        reason: input.reason,
        notes: input.notes || null,
      },
      include: {
        patient: true,
        provider: true,
      },
    });

    // Create history entry
    await this.createHistoryEntry(
      appointment.id,
      "CREATED",
      null,
      "REQUESTED",
      "Appointment created",
      performedBy
    );

    return appointment;
  }

  /**
   * Transition: REQUESTED → CONFIRMED
   */
  async confirmAppointment(
    appointmentId: string,
    performedBy: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentOrThrow(appointmentId);

    this.validateTransition(appointment.status, "CONFIRMED");

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status: "CONFIRMED" },
      include: {
        patient: true,
        provider: true,
      },
    });

    await this.createHistoryEntry(
      appointmentId,
      "CONFIRMED",
      appointment.status,
      "CONFIRMED",
      "Appointment confirmed",
      performedBy
    );

    return updated;
  }

  /**
   * Transition: CONFIRMED → CHECKED_IN
   */
  async checkInAppointment(
    appointmentId: string,
    performedBy: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentOrThrow(appointmentId);

    this.validateTransition(appointment.status, "CHECKED_IN");

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      },
      include: {
        patient: true,
        provider: true,
      },
    });

    await this.createHistoryEntry(
      appointmentId,
      "CHECKED_IN",
      appointment.status,
      "CHECKED_IN",
      "Patient checked in",
      performedBy
    );

    return updated;
  }

  /**
   * Transition: CHECKED_IN → COMPLETED
   */
  async completeAppointment(
    appointmentId: string,
    performedBy: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentOrThrow(appointmentId);

    this.validateTransition(appointment.status, "COMPLETED");

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "COMPLETED",
        checkedOutAt: new Date(),
      },
      include: {
        patient: true,
        provider: true,
      },
    });

    await this.createHistoryEntry(
      appointmentId,
      "COMPLETED",
      appointment.status,
      "COMPLETED",
      "Appointment completed",
      performedBy
    );

    return updated;
  }

  /**
   * Transition: CONFIRMED → NO_SHOW
   * 
   * Rules:
   * - Can only be marked NO_SHOW from CONFIRMED status
   * - Can only be marked NO_SHOW after the scheduled time has passed
   */
  async markNoShow(
    appointmentId: string,
    notes: string | undefined,
    performedBy: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentOrThrow(appointmentId);

    // Validate status transition
    this.validateTransition(appointment.status, "NO_SHOW");

    // Validate timing: can only mark NO_SHOW after scheduled time
    if (new Date() < appointment.scheduledAt) {
      throw new Error(
        "Cannot mark appointment as NO_SHOW before the scheduled time"
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "NO_SHOW",
        notes: notes
          ? `${appointment.notes || ""}\nNO_SHOW: ${notes}`.trim()
          : appointment.notes,
      },
      include: {
        patient: true,
        provider: true,
      },
    });

    await this.createHistoryEntry(
      appointmentId,
      "NO_SHOW",
      appointment.status,
      "NO_SHOW",
      notes || "Patient did not show up",
      performedBy
    );

    return updated;
  }

  /**
   * Transition: * → CANCELLED (before CHECKED_IN)
   * 
   * Rules:
   * - Cannot cancel after CHECKED_IN
   * - Cannot cancel if already in terminal state (COMPLETED, NO_SHOW, CANCELLED)
   * - Requires cancellation reason
   */
  async cancelAppointment(
    appointmentId: string,
    cancellationReason: string,
    performedBy: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentOrThrow(appointmentId);

    // Cannot cancel from terminal states
    if (
      appointment.status === "COMPLETED" ||
      appointment.status === "NO_SHOW" ||
      appointment.status === "CANCELLED"
    ) {
      throw new InvalidTransitionError(appointment.status, "CANCELLED");
    }

    // Cannot cancel after checked in
    if (appointment.status === "CHECKED_IN") {
      throw new Error(
        "Cannot cancel appointment after patient has been checked in. Please complete the appointment instead."
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED",
        notes: `${appointment.notes || ""}\nCANCELLED: ${cancellationReason}`.trim(),
      },
      include: {
        patient: true,
        provider: true,
      },
    });

    await this.createHistoryEntry(
      appointmentId,
      "CANCELLED",
      appointment.status,
      "CANCELLED",
      cancellationReason,
      performedBy
    );

    return updated;
  }

  /**
   * Reschedule an appointment
   * 
   * Rules:
   * - Cannot reschedule if COMPLETED, NO_SHOW, or CANCELLED
   * - Creates history entry
   */
  async rescheduleAppointment(
    appointmentId: string,
    newScheduledAt: Date,
    reason: string | undefined,
    performedBy: string
  ): Promise<Appointment> {
    const appointment = await this.getAppointmentOrThrow(appointmentId);

    // Cannot reschedule terminal states
    if (
      appointment.status === "COMPLETED" ||
      appointment.status === "NO_SHOW" ||
      appointment.status === "CANCELLED"
    ) {
      throw new Error(
        `Cannot reschedule appointment with status ${appointment.status}`
      );
    }

    // Check provider availability at new time
    const isAvailable = await availabilityService.isProviderAvailable(
      appointment.providerId,
      newScheduledAt,
      appointment.duration
    );

    if (!isAvailable) {
      throw new Error(
        "Provider is not available at the requested time. Please check their availability and choose a different time slot."
      );
    }

    // Check for scheduling conflicts
    const hasConflict = await this.hasSchedulingConflict(
      appointment.providerId,
      newScheduledAt,
      appointment.duration,
      appointmentId
    );

    if (hasConflict) {
      throw new Error(
        "This time slot conflicts with an existing appointment. Please choose a different time."
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        scheduledAt: newScheduledAt,
        notes: reason
          ? `${appointment.notes || ""}\nRescheduled: ${reason}`.trim()
          : appointment.notes,
      },
      include: {
        patient: true,
        provider: true,
      },
    });

    await this.createHistoryEntry(
      appointmentId,
      "RESCHEDULED",
      appointment.scheduledAt.toISOString(),
      newScheduledAt.toISOString(),
      reason || "Appointment rescheduled",
      performedBy
    );

    return updated;
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        provider: true,
        visitNote: true,
      },
    });
  }

  /**
   * Get appointments for a provider
   */
  async getProviderAppointments(
    providerId: string,
    filters?: {
      status?: AppointmentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: {
        providerId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.startDate || filters?.endDate
          ? {
              scheduledAt: {
                ...(filters.startDate ? { gte: filters.startDate } : {}),
                ...(filters.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        patient: true,
        provider: true,
      },
      orderBy: { scheduledAt: "asc" },
    });
  }

  /**
   * Get appointments for a patient
   */
  async getPatientAppointments(
    patientId: string,
    filters?: {
      status?: AppointmentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Appointment[]> {
    return prisma.appointment.findMany({
      where: {
        patientId,
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.startDate || filters?.endDate
          ? {
              scheduledAt: {
                ...(filters.startDate ? { gte: filters.startDate } : {}),
                ...(filters.endDate ? { lte: filters.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        patient: true,
        provider: true,
      },
      orderBy: { scheduledAt: "desc" },
    });
  }

  /**
   * Validate state transition
   */
  private validateTransition(
    currentStatus: AppointmentStatus,
    newStatus: AppointmentStatus
  ): void {
    const validNextStates = this.VALID_TRANSITIONS[currentStatus];

    if (!validNextStates.includes(newStatus)) {
      throw new InvalidTransitionError(currentStatus, newStatus);
    }
  }

  /**
   * Get appointment or throw error
   */
  private async getAppointmentOrThrow(
    appointmentId: string
  ): Promise<Appointment> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new AppointmentNotFoundError(appointmentId);
    }

    return appointment;
  }

  /**
   * Create appointment history entry
   */
  private async createHistoryEntry(
    appointmentId: string,
    action: HistoryAction,
    previousValue: string | null,
    newValue: string | null,
    notes: string,
    performedBy: string
  ): Promise<void> {
    await prisma.appointmentHistory.create({
      data: {
        appointmentId,
        action,
        previousValue,
        newValue,
        notes,
        performedBy,
      },
    });
  }

  /**
   * Check for scheduling conflicts
   */
  private async hasSchedulingConflict(
    providerId: string,
    scheduledAt: Date,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const appointmentEnd = new Date(scheduledAt.getTime() + duration * 60000);

    const conflicts = await prisma.appointment.findMany({
      where: {
        providerId,
        status: {
          in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"],
        },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        OR: [
          // New appointment starts during existing appointment
          {
            AND: [
              { scheduledAt: { lte: scheduledAt } },
              {
                scheduledAt: {
                  gt: new Date(scheduledAt.getTime() - duration * 60000),
                },
              },
            ],
          },
          // New appointment ends during existing appointment
          {
            AND: [
              { scheduledAt: { lt: appointmentEnd } },
              { scheduledAt: { gte: scheduledAt } },
            ],
          },
        ],
      },
    });

    return conflicts.length > 0;
  }
}

// Singleton instance
export const appointmentService = new AppointmentService();
