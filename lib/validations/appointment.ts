import { z } from "zod";
import { AppointmentType } from "@prisma/client";

/**
 * Appointment Validation Schemas
 * 
 * Validates appointment operations with business rules
 */

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, "Invalid patient ID"),
  providerId: z.string().min(1, "Invalid provider ID"),
  scheduledAt: z.coerce.date(),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(240, "Duration cannot exceed 4 hours").default(30),
  type: z.nativeEnum(AppointmentType).default(AppointmentType.FOLLOW_UP),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
  notes: z.string().max(1000, "Notes too long").optional(),
});

export const confirmAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "Invalid appointment ID"),
});

export const checkInAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "Invalid appointment ID"),
});

export const completeAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "Invalid appointment ID"),
});

export const markNoShowSchema = z.object({
  appointmentId: z.string().min(1, "Invalid appointment ID"),
  notes: z.string().max(500, "Notes too long").optional(),
});

export const cancelAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "Invalid appointment ID"),
  cancellationReason: z.string().min(1, "Cancellation reason is required").max(500, "Reason too long"),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "Invalid appointment ID"),
  newScheduledAt: z.coerce.date(),
  reason: z.string().max(500, "Reason too long").optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ConfirmAppointmentInput = z.infer<typeof confirmAppointmentSchema>;
export type CheckInAppointmentInput = z.infer<typeof checkInAppointmentSchema>;
export type CompleteAppointmentInput = z.infer<typeof completeAppointmentSchema>;
export type MarkNoShowInput = z.infer<typeof markNoShowSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
