import { z } from "zod";

/**
 * Provider Validation Schemas
 *
 * A provider is two rows: a User (login, role PROVIDER) and a Provider
 * (clinical identity), plus an optional ProviderProfile. These schemas cover
 * all three so the form, the action and the database agree on every field.
 */

const optionalText = (max: number) =>
  z.string().trim().max(max, `Must be ${max} characters or fewer`).optional().or(z.literal(""));

export const providerProfileSchema = z.object({
  specialization: optionalText(120),
  licenseNumber: optionalText(60),
  phone: z
    .string()
    .trim()
    .regex(/^[\d\s\-()+]*$/, "Invalid phone number format")
    .max(30)
    .optional()
    .or(z.literal("")),
  officeLocation: optionalText(200),
  bio: optionalText(2000),
  // Match the ProviderProfile column defaults and the booking form's limits.
  appointmentLength: z
    .number({ error: "Enter the visit length in minutes" })
    .int("Use whole minutes")
    .min(15, "At least 15 minutes")
    .max(240, "At most 4 hours"),
  bufferTime: z
    .number({ error: "Enter the buffer in minutes" })
    .int("Use whole minutes")
    .min(0, "Can't be negative")
    .max(120, "At most 2 hours"),
});

const identity = {
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  title: optionalText(20),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  profile: providerProfileSchema,
};

export const createProviderSchema = z.object({
  ...identity,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
});

export const updateProviderSchema = z.object({
  id: z.string().min(1, "Provider ID is required"),
  ...identity,
  // Blank keeps the current password.
  password: z
    .string()
    .max(128, "Password is too long")
    .refine((v) => v === "" || v.length >= 8, "Password must be at least 8 characters")
    .optional(),
});

export const setProviderActiveSchema = z.object({
  id: z.string().min(1, "Provider ID is required"),
  isActive: z.boolean(),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type SetProviderActiveInput = z.infer<typeof setProviderActiveSchema>;
