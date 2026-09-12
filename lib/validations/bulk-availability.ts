import { z } from "zod";
import { DayOfWeek } from "@prisma/client";
import { isTimeString } from "@/lib/clinic-time";

/**
 * Bulk Availability Validation Schemas
 *
 * Availability slots are weekly and recurring: the table has no date column.
 * Bulk create therefore takes days of the week and a time range only. It used
 * to take a date range as well and create one slot per matching *date*, which
 * made the second Monday collide with the first and churned rows when
 * "overwrite" was on. The form was already sending a made-up one-week range.
 */

const timeString = z
  .string()
  .refine(isTimeString, "Use a 24-hour time such as 09:00 or 14:30");

// ============================================================================
// BULK CREATE AVAILABILITY SLOTS
// ============================================================================

export const bulkCreateAvailabilitySchema = z
  .object({
    providerId: z.string().min(1, "Provider ID is required"),

    daysOfWeek: z
      .array(z.nativeEnum(DayOfWeek))
      .min(1, "At least one day of week is required")
      .refine(
        (days) => new Set(days).size === days.length,
        "Duplicate days of week are not allowed"
      ),

    startTime: timeString,
    endTime: timeString,

    skipCollisions: z.boolean().optional().default(true),
    overwriteExisting: z.boolean().optional().default(false),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export type BulkCreateAvailabilityInput = z.input<typeof bulkCreateAvailabilitySchema>;

// ============================================================================
// EXPORT SCHEDULE TO CSV
// ============================================================================

export const exportScheduleSchema = z
  .object({
    providerId: z.string().min(1, "Provider ID is required"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    format: z.enum(["csv", "json"]).optional().default("csv"),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: "Start date must be before end date",
    path: ["endDate"],
  })
  .refine(
    (data) => {
      const maxMs = 12 * 30 * 24 * 60 * 60 * 1000;
      return data.endDate.getTime() - data.startDate.getTime() <= maxMs;
    },
    {
      message: "Date range cannot exceed 12 months",
      path: ["endDate"],
    }
  );

export type ExportScheduleInput = z.input<typeof exportScheduleSchema>;

// ============================================================================
// DELETE BULK AVAILABILITY
// ============================================================================

/**
 * Archives every active slot on the given days. Slots have no dates, so there
 * is no date range to honour; it was accepted before and silently ignored.
 */
export const deleteBulkAvailabilitySchema = z.object({
  providerId: z.string().min(1, "Provider ID is required"),
  daysOfWeek: z
    .array(z.nativeEnum(DayOfWeek))
    .min(1, "At least one day of week is required"),
});

export type DeleteBulkAvailabilityInput = z.infer<typeof deleteBulkAvailabilitySchema>;
