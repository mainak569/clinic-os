"use server";

import { headers } from "next/headers";
import { requireAuth, canAccessProviderData } from "@/lib/auth-helpers";
import { visitNoteService } from "@/lib/services/visit-note.service";
import { appointmentService } from "@/lib/services/appointment.service";
import { auditService } from "@/lib/services/audit.service";
import { serializeVisitNote } from "@/lib/serialize";
import { revalidateDashboard } from "@/lib/revalidate";
import { actionErrorMessage } from "@/lib/action-error";
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
 * Authorization Rules:
 * - PROVIDER: Can create notes for own appointments only
 * - PROVIDER: Can edit only notes they authored
 * - FRONT_DESK: Cannot create or edit visit notes (clinical staff only)
 *
 * Every read returns vitals as plain numbers: temperature, weight and height
 * are Decimal columns, and Decimal instances can't be sent to the client.
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const CLINICAL_FIELDS = [
  "chiefComplaint",
  "historyOfPresent",
  "physicalExam",
  "assessment",
  "plan",
  "bloodPressure",
  "heartRate",
  "temperature",
  "respiratoryRate",
  "oxygenSaturation",
  "weight",
  "height",
  "prescriptions",
  "labOrders",
  "imagingOrders",
  "referrals",
  "followUpInstructions",
  "nextVisitDate",
] as const;

/** Keep only the fields the caller actually sent (null included). */
function pickProvided<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    CLINICAL_FIELDS.filter((key) => input[key] !== undefined).map((key) => [key, input[key]])
  );
}

async function audit(
  userId: string,
  action: "CREATE" | "UPDATE",
  resourceId: string,
  details: Record<string, unknown>
) {
  const headersList = await headers();
  await auditService.log({
    userId,
    action,
    resource: "VISIT_NOTE",
    resourceId,
    details,
    ipAddress: headersList.get("x-forwarded-for") ?? null,
    userAgent: headersList.get("user-agent") ?? null,
  });
}

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

    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Only providers can create visit notes" };
    }
    if (!session.user.providerId) {
      return { success: false, error: "Provider ID not found in session" };
    }

    const validatedInput = createVisitNoteSchema.parse(input);

    const appointment = await appointmentService.getAppointmentById(validatedInput.appointmentId);
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }
    if (appointment.providerId !== session.user.providerId) {
      return {
        success: false,
        error: "You can only create visit notes for your own appointments",
      };
    }

    const visitNote = await visitNoteService.createVisitNote({
      appointmentId: validatedInput.appointmentId,
      authorId: session.user.id,
      ...(pickProvided(validatedInput) as Omit<CreateVisitNoteInput, "appointmentId">),
    });

    await audit(session.user.id, "CREATE", visitNote.id, {
      appointmentId: validatedInput.appointmentId,
      fields: Object.keys(pickProvided(validatedInput)),
    });

    revalidateDashboard();

    return { success: true, data: { id: visitNote.id } };
  } catch (error) {
    console.error("createVisitNote error:", error);
    return { success: false, error: actionErrorMessage(error, "Failed to create visit note") };
  }
}

/**
 * Update an existing visit note
 *
 * Only the original author can edit their notes.
 * Creates an immutable history snapshot automatically.
 */
export async function updateVisitNote(
  input: UpdateVisitNoteInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    if (session.user.role !== "PROVIDER") {
      return { success: false, error: "Only providers can update visit notes" };
    }

    const validatedInput = updateVisitNoteSchema.parse(input);

    const canEdit = await visitNoteService.canEditVisitNote(
      validatedInput.visitNoteId,
      session.user.id
    );
    if (!canEdit) {
      return { success: false, error: "You can only edit visit notes you authored" };
    }

    const changes = pickProvided(validatedInput);
    const visitNote = await visitNoteService.updateVisitNote(
      validatedInput.visitNoteId,
      session.user.id,
      {
        ...(validatedInput.changeReason !== undefined && {
          changeReason: validatedInput.changeReason,
        }),
        ...(changes as Record<string, never>),
      }
    );

    await audit(session.user.id, "UPDATE", visitNote.id, {
      appointmentId: visitNote.appointmentId,
      fields: Object.keys(changes),
      changeReason: validatedInput.changeReason ?? null,
    });

    revalidateDashboard();

    return { success: true, data: { id: visitNote.id } };
  } catch (error) {
    console.error("updateVisitNote error:", error);
    return { success: false, error: actionErrorMessage(error, "Failed to update visit note") };
  }
}

/**
 * Get visit note by ID
 */
export async function getVisitNote(input: GetVisitNoteInput): Promise<ActionResult<any>> {
  try {
    await requireAuth();

    const validatedInput = getVisitNoteSchema.parse(input);
    const visitNote = await visitNoteService.getVisitNoteById(validatedInput.visitNoteId);

    if (!visitNote) {
      return { success: false, error: "Visit note not found" };
    }

    const appointment = (visitNote as any).appointment;
    if (!appointment || !appointment.provider) {
      return { success: false, error: "Invalid visit note data" };
    }

    const canAccess = await canAccessProviderData(appointment.provider.id);
    if (!canAccess) {
      return { success: false, error: "You do not have permission to view this visit note" };
    }

    return { success: true, data: serializeVisitNote(visitNote as any) };
  } catch (error) {
    console.error("getVisitNote error:", error);
    return { success: false, error: actionErrorMessage(error, "Failed to get visit note") };
  }
}

/**
 * Get visit note by appointment ID
 */
export async function getVisitNoteByAppointment(
  input: GetVisitNoteByAppointmentInput
): Promise<ActionResult<any>> {
  try {
    await requireAuth();

    const validatedInput = getVisitNoteByAppointmentSchema.parse(input);

    const appointment = await appointmentService.getAppointmentById(validatedInput.appointmentId);
    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    const canAccess = await canAccessProviderData(appointment.providerId);
    if (!canAccess) {
      return { success: false, error: "You do not have permission to view this visit note" };
    }

    const visitNote = await visitNoteService.getVisitNoteByAppointmentId(
      validatedInput.appointmentId
    );

    return { success: true, data: serializeVisitNote(visitNote as any) };
  } catch (error) {
    console.error("getVisitNoteByAppointment error:", error);
    return { success: false, error: actionErrorMessage(error, "Failed to get visit note") };
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
    await requireAuth();

    const validatedInput = getVisitNoteHistorySchema.parse(input);

    const visitNote = await visitNoteService.getVisitNoteById(validatedInput.visitNoteId);
    if (!visitNote) {
      return { success: false, error: "Visit note not found" };
    }

    const appointment = (visitNote as any).appointment;
    if (!appointment || !appointment.provider) {
      return { success: false, error: "Invalid visit note data" };
    }

    const canAccess = await canAccessProviderData(appointment.provider.id);
    if (!canAccess) {
      return { success: false, error: "You do not have permission to view this history" };
    }

    const history = await visitNoteService.getVisitNoteHistory(validatedInput.visitNoteId);

    return {
      success: true,
      data: history.map((entry) => serializeVisitNote(entry as any)),
    };
  } catch (error) {
    console.error("getVisitNoteHistory error:", error);
    return { success: false, error: actionErrorMessage(error, "Failed to get visit note history") };
  }
}
