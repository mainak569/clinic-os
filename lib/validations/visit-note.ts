import { z } from "zod";

/**
 * Visit Note Validation Schemas
 * 
 * Validates all visit note operations with strict type safety
 */

// ============================================================================
// CREATE VISIT NOTE
// ============================================================================

export const createVisitNoteSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  chiefComplaint: z.string().optional(),
  historyOfPresent: z.string().optional(),
  physicalExam: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  respiratoryRate: z.number().int().positive().optional(),
  oxygenSaturation: z.number().int().min(0).max(100).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  prescriptions: z.string().optional(),
  labOrders: z.string().optional(),
  imagingOrders: z.string().optional(),
  referrals: z.string().optional(),
  followUpInstructions: z.string().optional(),
  nextVisitDate: z.coerce.date().optional(),
});

export type CreateVisitNoteInput = z.infer<typeof createVisitNoteSchema>;

// ============================================================================
// UPDATE VISIT NOTE
// ============================================================================

export const updateVisitNoteSchema = z.object({
  visitNoteId: z.string().min(1, "Visit note ID is required"),
  changeReason: z.string().optional(),
  chiefComplaint: z.string().optional(),
  historyOfPresent: z.string().optional(),
  physicalExam: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  bloodPressure: z.string().optional(),
  heartRate: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  respiratoryRate: z.number().int().positive().optional(),
  oxygenSaturation: z.number().int().min(0).max(100).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  prescriptions: z.string().optional(),
  labOrders: z.string().optional(),
  imagingOrders: z.string().optional(),
  referrals: z.string().optional(),
  followUpInstructions: z.string().optional(),
  nextVisitDate: z.coerce.date().optional().nullable(),
});

export type UpdateVisitNoteInput = z.infer<typeof updateVisitNoteSchema>;

// ============================================================================
// GET VISIT NOTE
// ============================================================================

export const getVisitNoteSchema = z.object({
  visitNoteId: z.string().min(1, "Visit note ID is required"),
});

export type GetVisitNoteInput = z.infer<typeof getVisitNoteSchema>;

// ============================================================================
// GET VISIT NOTE BY APPOINTMENT
// ============================================================================

export const getVisitNoteByAppointmentSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
});

export type GetVisitNoteByAppointmentInput = z.infer<
  typeof getVisitNoteByAppointmentSchema
>;

// ============================================================================
// GET VISIT NOTE HISTORY
// ============================================================================

export const getVisitNoteHistorySchema = z.object({
  visitNoteId: z.string().min(1, "Visit note ID is required"),
});

export type GetVisitNoteHistoryInput = z.infer<
  typeof getVisitNoteHistorySchema
>;
