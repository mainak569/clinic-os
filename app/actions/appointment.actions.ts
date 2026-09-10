"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, canAccessProviderData } from "@/lib/auth-helpers";
import { appointmentService } from "@/lib/services/appointment.service";
import {
  createAppointmentSchema,
  confirmAppointmentSchema,
  checkInAppointmentSchema,
  completeAppointmentSchema,
  markNoShowSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  type CreateAppointmentInput,
  type ConfirmAppointmentInput,
  type CheckInAppointmentInput,
  type CompleteAppointmentInput,
  type MarkNoShowInput,
  type CancelAppointmentInput,
  type RescheduleAppointmentInput,
} from "@/lib/validations/appointment";
import {
  UnauthorizedAppointmentAccessError,
} from "@/lib/errors/appointment-errors";

/**
 * Appointment Server Actions
 * 
 * Handles authorization and delegates business logic to service layer
 * Returns { success, data?, error? } for client consumption
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Create a new appointment (REQUESTED status)
 */
export async function createAppointment(
  input: CreateAppointmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = createAppointmentSchema.parse(input);

    // Authorization: check if user can create appointments for this provider
    const canAccess = await canAccessProviderData(validatedInput.providerId);
    if (!canAccess) {
      throw new UnauthorizedAppointmentAccessError(
        "You can only create appointments for yourself"
      );
    }

    // Business logic
    const appointment = await appointmentService.createAppointment(
      {
        patientId: validatedInput.patientId,
        providerId: validatedInput.providerId,
        scheduledAt: validatedInput.scheduledAt,
        duration: validatedInput.duration,
        type: validatedInput.type,
        reason: validatedInput.reason,
        ...(validatedInput.notes ? { notes: validatedInput.notes } : {}),
      },
      session.user.id
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");

    return { success: true, data: { id: appointment.id } };
  } catch (error) {
    console.error("createAppointment error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to create appointment" };
  }
}

/**
 * Confirm appointment (REQUESTED → CONFIRMED)
 */
export async function confirmAppointment(
  input: ConfirmAppointmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = confirmAppointmentSchema.parse(input);

    // Get appointment to check authorization
    const appointment = await appointmentService.getAppointmentById(
      validatedInput.appointmentId
    );
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Authorization: check if user can modify this appointment
    const canAccess = await canAccessProviderData(appointment.providerId);
    if (!canAccess) {
      throw new UnauthorizedAppointmentAccessError();
    }

    // Business logic
    const updated = await appointmentService.confirmAppointment(
      validatedInput.appointmentId,
      session.user.id
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${validatedInput.appointmentId}`);

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("confirmAppointment error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to confirm appointment" };
  }
}

/**
 * Check in appointment (CONFIRMED → CHECKED_IN)
 */
export async function checkInAppointment(
  input: CheckInAppointmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = checkInAppointmentSchema.parse(input);

    // Get appointment to check authorization
    const appointment = await appointmentService.getAppointmentById(
      validatedInput.appointmentId
    );
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Authorization: check if user can modify this appointment
    const canAccess = await canAccessProviderData(appointment.providerId);
    if (!canAccess) {
      throw new UnauthorizedAppointmentAccessError();
    }

    // Business logic
    const updated = await appointmentService.checkInAppointment(
      validatedInput.appointmentId,
      session.user.id
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${validatedInput.appointmentId}`);

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("checkInAppointment error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to check in appointment" };
  }
}

/**
 * Complete appointment (CHECKED_IN → COMPLETED)
 */
export async function completeAppointment(
  input: CompleteAppointmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = completeAppointmentSchema.parse(input);

    // Get appointment to check authorization
    const appointment = await appointmentService.getAppointmentById(
      validatedInput.appointmentId
    );
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Authorization: check if user can modify this appointment
    const canAccess = await canAccessProviderData(appointment.providerId);
    if (!canAccess) {
      throw new UnauthorizedAppointmentAccessError();
    }

    // Business logic
    const updated = await appointmentService.completeAppointment(
      validatedInput.appointmentId,
      session.user.id
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${validatedInput.appointmentId}`);

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("completeAppointment error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to complete appointment" };
  }
}

/**
 * Mark appointment as NO_SHOW (CONFIRMED → NO_SHOW)
 * 
 * Rules:
 * - Can only mark NO_SHOW from CONFIRMED status
 * - Can only mark NO_SHOW after scheduled time
 */
export async function markAppointmentNoShow(
  input: MarkNoShowInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = markNoShowSchema.parse(input);

    // Get appointment to check authorization
    const appointment = await appointmentService.getAppointmentById(
      validatedInput.appointmentId
    );
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Authorization: check if user can modify this appointment
    const canAccess = await canAccessProviderData(appointment.providerId);
    if (!canAccess) {
      throw new UnauthorizedAppointmentAccessError();
    }

    // Business logic
    const updated = await appointmentService.markNoShow(
      validatedInput.appointmentId,
      validatedInput.notes,
      session.user.id
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${validatedInput.appointmentId}`);

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("markAppointmentNoShow error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to mark appointment as no-show" };
  }
}

/**
 * Cancel appointment
 * 
 * Rules:
 * - Cannot cancel after CHECKED_IN
 * - Requires cancellation reason
 */
export async function cancelAppointment(
  input: CancelAppointmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = cancelAppointmentSchema.parse(input);

    // Get appointment to check authorization
    const appointment = await appointmentService.getAppointmentById(
      validatedInput.appointmentId
    );
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Authorization: check if user can modify this appointment
    const canAccess = await canAccessProviderData(appointment.providerId);
    if (!canAccess) {
      throw new UnauthorizedAppointmentAccessError();
    }

    // Business logic
    const updated = await appointmentService.cancelAppointment(
      validatedInput.appointmentId,
      validatedInput.cancellationReason,
      session.user.id
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${validatedInput.appointmentId}`);

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("cancelAppointment error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to cancel appointment" };
  }
}

/**
 * Reschedule appointment
 */
export async function rescheduleAppointment(
  input: RescheduleAppointmentInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = rescheduleAppointmentSchema.parse(input);

    // Get appointment to check authorization
    const appointment = await appointmentService.getAppointmentById(
      validatedInput.appointmentId
    );
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Authorization: check if user can modify this appointment
    const canAccess = await canAccessProviderData(appointment.providerId);
    if (!canAccess) {
      throw new UnauthorizedAppointmentAccessError();
    }

    // Business logic
    const updated = await appointmentService.rescheduleAppointment(
      validatedInput.appointmentId,
      validatedInput.newScheduledAt,
      validatedInput.reason,
      session.user.id
    );

    // Revalidate relevant paths
    revalidatePath("/dashboard");
    revalidatePath("/appointments");
    revalidatePath(`/appointments/${validatedInput.appointmentId}`);

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("rescheduleAppointment error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to reschedule appointment" };
  }
}

/**
 * Get appointments for current user's provider
 */
export async function getMyAppointments(filters?: {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<ActionResult<any[]>> {
  try {
    const session = await requireAuth();

    if (!session.user.providerId && session.user.role !== "FRONT_DESK") {
      return { success: false, error: "User is not associated with a provider" };
    }

    // Get appointments based on role
    let appointments;
    if (session.user.role === "FRONT_DESK") {
      // Front desk sees all appointments - would need a different service method
      // For now, return error to keep scope limited
      return { success: false, error: "Front desk view not implemented yet" };
    } else {
      appointments = await appointmentService.getProviderAppointments(
        session.user.providerId!,
        filters as any
      );
    }

    return { success: true, data: appointments };
  } catch (error) {
    console.error("getMyAppointments error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to get appointments" };
  }
}
