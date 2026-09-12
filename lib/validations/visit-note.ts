import { z } from "zod";

/**
 * Visit Note Validation Schemas
 *
 * Vital-sign bounds are clinically plausible ranges that also fit the database
 * columns: temperature is DECIMAL(4,1) and weight/height are DECIMAL(5,2), so an
 * out-of-range number previously reached Postgres and came back as an overflow
 * error. The visit-note form enforces the same ranges.
 *
 * On update, `null` clears a field and `undefined` leaves it unchanged. Before,
 * the update path had no way to express "clear", so a vital recorded by mistake
 * could never be removed.
 */

export const VITAL_BOUNDS = {
  heartRate: { label: "Heart rate", min: 20, max: 300, integer: true },
  temperature: { label: "Temperature", min: 80, max: 115, integer: false },
  respiratoryRate: { label: "Respiratory rate", min: 4, max: 80, integer: true },
  oxygenSaturation: { label: "Oxygen saturation", min: 0, max: 100, integer: true },
  weight: { label: "Weight", min: 0.1, max: 999.99, integer: false },
  height: { label: "Height", min: 0.1, max: 999.99, integer: false },
} as const;

export const BLOOD_PRESSURE_RE = /^\d{2,3}\/\d{2,3}$/;

function vital(key: keyof typeof VITAL_BOUNDS) {
  const { label, min, max, integer } = VITAL_BOUNDS[key];
  const base = z
    .number()
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);
  return integer ? base.int(`${label} must be a whole number`) : base;
}

const text = z.string().max(10000, "Too long");
const bloodPressure = z
  .string()
  .regex(BLOOD_PRESSURE_RE, "Blood pressure must look like 120/80");

const fields = {
  chiefComplaint: text,
  historyOfPresent: text,
  physicalExam: text,
  assessment: text,
  plan: text,
  bloodPressure,
  heartRate: vital("heartRate"),
  temperature: vital("temperature"),
  respiratoryRate: vital("respiratoryRate"),
  oxygenSaturation: vital("oxygenSaturation"),
  weight: vital("weight"),
  height: vital("height"),
  prescriptions: text,
  labOrders: text,
  imagingOrders: text,
  referrals: text,
  followUpInstructions: text,
  nextVisitDate: z.coerce.date(),
};

type Fields = typeof fields;

function optionalFields() {
  return Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, v.optional()])
  ) as { [K in keyof Fields]: z.ZodOptional<Fields[K]> };
}

function clearableFields() {
  return Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, v.nullable().optional()])
  ) as { [K in keyof Fields]: z.ZodOptional<z.ZodNullable<Fields[K]>> };
}

// ============================================================================
// CREATE VISIT NOTE
// ============================================================================

export const createVisitNoteSchema = z.object({
  appointmentId: z.string().min(1, "Appointment ID is required"),
  ...optionalFields(),
});

export type CreateVisitNoteInput = z.infer<typeof createVisitNoteSchema>;

// ============================================================================
// UPDATE VISIT NOTE
// ============================================================================

export const updateVisitNoteSchema = z.object({
  visitNoteId: z.string().min(1, "Visit note ID is required"),
  changeReason: z.string().max(500, "Reason too long").optional(),
  ...clearableFields(),
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

export type GetVisitNoteByAppointmentInput = z.infer<typeof getVisitNoteByAppointmentSchema>;

// ============================================================================
// GET VISIT NOTE HISTORY
// ============================================================================

export const getVisitNoteHistorySchema = z.object({
  visitNoteId: z.string().min(1, "Visit note ID is required"),
});

export type GetVisitNoteHistoryInput = z.infer<typeof getVisitNoteHistorySchema>;
