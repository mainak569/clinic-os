import { z } from "zod";

/**
 * Patient Validation Schemas
 * 
 * Centralized validation for all patient-related operations
 * Used in Server Actions and API routes
 */

// Phone number validation (US format, flexible)
const phoneSchema = z
  .string()
  .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone number format")
  .min(10, "Phone number must be at least 10 digits")
  .optional()
  .or(z.literal(""));

// Email validation
const emailSchema = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""));

/**
 * Create Patient Schema
 */
export const createPatientSchema = z.object({
  // Required fields
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),

  // Contact information
  email: emailSchema,
  phone: phoneSchema,
  dateOfBirth: z.coerce.date().optional(),

  // Address
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(2).optional().or(z.literal("")),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code")
    .optional()
    .or(z.literal("")),

  // Emergency Contact
  emergencyContactName: z.string().max(200).optional().or(z.literal("")),
  emergencyContactPhone: phoneSchema,

  // Insurance
  insuranceProvider: z.string().max(200).optional().or(z.literal("")),
  insuranceId: z.string().max(100).optional().or(z.literal("")),

  // Medical Information
  allergies: z.string().max(1000).optional().or(z.literal("")),
  medications: z.string().max(1000).optional().or(z.literal("")),
  medicalHistory: z.string().max(2000).optional().or(z.literal("")),
}).refine(
  (data) => data.email || data.phone,
  {
    message: "At least one contact method (email or phone) is required",
    path: ["email"],
  }
);

/**
 * Update Patient Schema
 * Same as create but requires ID
 */
export const updatePatientSchema = createPatientSchema.extend({
  id: z.string().min(1, "Patient ID is required"),
});

/**
 * Delete Patient Schema
 */
export const deletePatientSchema = z.object({
  id: z.string().min(1, "Patient ID is required"),
});

/**
 * Search Patients Schema
 */
export const searchPatientsSchema = z.object({
  query: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  includeInactive: z.boolean().default(false),
});

/**
 * Get Patient By ID Schema
 */
export const getPatientByIdSchema = z.object({
  id: z.string().min(1, "Patient ID is required"),
});

// Export types
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type DeletePatientInput = z.infer<typeof deletePatientSchema>;
export type SearchPatientsInput = z.infer<typeof searchPatientsSchema>;
export type GetPatientByIdInput = z.infer<typeof getPatientByIdSchema>;
