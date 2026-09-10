import { z } from "zod";
import { DayOfWeek } from "@prisma/client";

/**
 * Bulk Availability Validation Schemas
 * 
 * Validates bulk creation of recurring availability slots
 */

// ============================================================================
// BULK CREATE AVAILABILITY SLOTS
// ============================================================================

export const bulkCreateAvailabilitySchema = z.object({
  providerId: z.string().min(1, "Provider ID is required"),
  
  // Days of week to create slots
  daysOfWeek: z
    .array(z.nativeEnum(DayOfWeek))
    .min(1, "At least one day of week is required")
    .refine((days) => {
      const unique = new Set(days);
      return unique.size === days.length;
    }, "Duplicate days of week are not allowed"),
  
  // Time range for each day
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  
  // Date range for recurrence
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  
  // Options
  skipCollisions: z.boolean().optional().default(false),
  overwriteExisting: z.boolean().optional().default(false),
}).refine(
  (data) => {
    // Validate start time is before end time
    const start = data.startTime;
    const end = data.endTime;
    return start < end;
  },
  {
    message: "Start time must be before end time",
    path: ["endTime"],
  }
).refine(
  (data) => {
    // Validate start date is before end date
    return data.startDate < data.endDate;
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    // Validate date range is reasonable (max 6 months)
    const maxMonths = 6;
    const maxMs = maxMonths * 30 * 24 * 60 * 60 * 1000;
    const rangeMs = data.endDate.getTime() - data.startDate.getTime();
    return rangeMs <= maxMs;
  },
  {
    message: "Date range cannot exceed 6 months",
    path: ["endDate"],
  }
);

export type BulkCreateAvailabilityInput = z.infer<
  typeof bulkCreateAvailabilitySchema
>;

// ============================================================================
// EXPORT SCHEDULE TO CSV
// ============================================================================

export const exportScheduleSchema = z.object({
  providerId: z.string().min(1, "Provider ID is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  format: z.enum(["csv", "json"]).optional().default("csv"),
}).refine(
  (data) => {
    return data.startDate < data.endDate;
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    // Validate date range is reasonable (max 12 months for export)
    const maxMonths = 12;
    const maxMs = maxMonths * 30 * 24 * 60 * 60 * 1000;
    const rangeMs = data.endDate.getTime() - data.startDate.getTime();
    return rangeMs <= maxMs;
  },
  {
    message: "Date range cannot exceed 12 months",
    path: ["endDate"],
  }
);

export type ExportScheduleInput = z.infer<typeof exportScheduleSchema>;

// ============================================================================
// DELETE BULK AVAILABILITY
// ============================================================================

export const deleteBulkAvailabilitySchema = z.object({
  providerId: z.string().min(1, "Provider ID is required"),
  daysOfWeek: z
    .array(z.nativeEnum(DayOfWeek))
    .min(1, "At least one day of week is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type DeleteBulkAvailabilityInput = z.infer<
  typeof deleteBulkAvailabilitySchema
>;
