import { prisma } from "@/lib/prisma";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  HistoryAction,
  Prisma,
} from "@prisma/client";
import {
  AppointmentNotFoundError,
  InvalidTransitionError,
} from "@/lib/errors/appointment-errors";
import { availabilityService } from "./availability.service";

/** Longest visit the booking form allows (matches createAppointmentSchema). */
const MAX_APPOINTMENT_MINUTES = 240;

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
    CHECKED_IN: ["COMPLETED"], // Cannot cancel after check-in
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
    this.assertNotInPast(input.scheduledAt);
    await this.assertBookable(input.patientId, input.providerId);

    // Check provider availability
    const isAvailable = await availabilityService.isProviderAvailable(
      input.providerId,
      input.scheduledAt,
      input.duration
    );

    if (!isAvailable) {
      throw new Error(
        "Provider is not available at the requested time. Please go to the Schedule page to set up provider availability first, or choose a time that matches existing availability slots."
      );
    }

    // Conflict check and insert happen under one per-provider lock, so two
    // simultaneous requests for the same slot can't both pass the check.
    const appointment = await this.withProviderLock(input.providerId, async (tx) => {
      const hasConflict = await this.hasSchedulingConflict(
        input.providerId,
        input.scheduledAt,
        input.duration,
        undefined,
        tx
      );

      if (hasConflict) {
        throw new Error(
          "This time slot conflicts with an existing appointment. Please choose a different time."
        );
      }

      return tx.appointment.create({
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

    this.assertNotInPast(newScheduledAt);

    // Check provider availability at new time
    const isAvailable = await availabilityService.isProviderAvailable(
      appointment.providerId,
      newScheduledAt,
      appointment.duration
    );

    if (!isAvailable) {
      throw new Error(
        "Provider is not available at the requested time. Please go to the Schedule page to set up provider availability first, or choose a time that matches existing availability slots."
      );
    }

    const updated = await this.withProviderLock(appointment.providerId, async (tx) => {
      const hasConflict = await this.hasSchedulingConflict(
        appointment.providerId,
        newScheduledAt,
        appointment.duration,
        appointmentId,
        tx
      );

      if (hasConflict) {
        throw new Error(
          "This time slot conflicts with an existing appointment. Please choose a different time."
        );
      }

      return tx.appointment.update({
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
    try {
      // Verify the user exists before creating history entry
      const userExists = await prisma.user.findUnique({
        where: { id: performedBy },
        select: { id: true },
      });

      if (!userExists) {
        console.error(`Cannot create appointment history: User ${performedBy} not found in database. This usually happens when the session is stale after a database reset.`);
        // Still create the appointment but skip history for now
        // In production, you might want to use a system user ID instead
        return;
      }

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
    } catch (error) {
      // Log but don't fail the main operation
      console.error('Failed to create appointment history:', error);
      // In production, send to error tracking service
    }
  }

  /**
   * Run `fn` in a transaction that holds a lock for this provider.
   *
   * Checking for a conflict and then inserting is two steps; without a lock,
   * two requests for the same slot both see it free and both insert. A
   * transaction-scoped Postgres advisory lock makes bookings for one provider
   * take turns, while other providers are unaffected. It is released
   * automatically when the transaction ends, which also suits the Supabase
   * pooler's transaction mode.
   */
  private async withProviderLock<T>(
    providerId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return prisma.$transaction(
      async (tx) => {
        // pg_advisory_xact_lock returns void, which Prisma can't deserialize.
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${providerId}))::text`;
        return fn(tx);
      },
      { maxWait: 10000, timeout: 15000 }
    );
  }

  /**
   * Reject bookings for archived patients or inactive providers.
   *
   * Without this, a deleted patient could still be booked by id, and a missing
   * id surfaced as a raw foreign-key error from the database.
   */
  private async assertBookable(patientId: string, providerId: string): Promise<void> {
    const [patient, provider] = await Promise.all([
      prisma.patient.findUnique({ where: { id: patientId }, select: { isActive: true } }),
      prisma.provider.findUnique({ where: { id: providerId }, select: { isActive: true } }),
    ]);

    if (!patient) {
      throw new Error("Patient not found.");
    }
    if (!patient.isActive) {
      throw new Error(
        "This patient's record is archived. Re-register the patient before booking."
      );
    }
    if (!provider) {
      throw new Error("Provider not found.");
    }
    if (!provider.isActive) {
      throw new Error("This provider is inactive and can't take new appointments.");
    }
  }

  /**
   * A new or moved appointment can't start in the past. A few minutes of grace
   * covers the time between opening the form and submitting it.
   */
  private assertNotInPast(when: Date): void {
    const GRACE_MS = 5 * 60 * 1000;
    if (when.getTime() < Date.now() - GRACE_MS) {
      throw new Error(
        "Appointments can't be scheduled in the past. Choose a future date and time."
      );
    }
  }

  /**
   * Check for scheduling conflicts
   *
   * Two visits overlap when each starts before the other ends. The previous
   * query measured existing appointments with the *new* visit's duration, so a
   * 15-minute booking at 10:30 slipped past a 60-minute visit at 10:00.
   */
  private async hasSchedulingConflict(
    providerId: string,
    scheduledAt: Date,
    duration: number,
    excludeAppointmentId?: string,
    client: Prisma.TransactionClient = prisma
  ): Promise<boolean> {
    const start = scheduledAt.getTime();
    const end = start + duration * 60000;

    // No visit is longer than MAX_APPOINTMENT_MINUTES, so nothing that starts
    // earlier than that can still be running when this one begins.
    const windowStart = new Date(start - MAX_APPOINTMENT_MINUTES * 60000);

    const candidates = await client.appointment.findMany({
      where: {
        providerId,
        status: {
          in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"],
        },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        scheduledAt: { gte: windowStart, lt: new Date(end) },
      },
      select: { scheduledAt: true, duration: true },
    });

    return candidates.some((existing) => {
      const existingStart = new Date(existing.scheduledAt).getTime();
      const existingEnd = existingStart + existing.duration * 60000;
      return existingStart < end && existingEnd > start;
    });
  }
}

// Singleton instance
export const appointmentService = new AppointmentService();
