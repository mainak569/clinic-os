import { z } from "zod";
import { DayOfWeek } from "@prisma/client";
import { isTimeString } from "@/lib/clinic-time";

/**
 * Availability Validation Schemas
 *
 * Slot times travel as 24-hour "HH:MM" wall-clock strings, never as Date
 * objects. A Date built in the browser carries the browser's timezone into the
 * database, which is how the same "09:00" ended up stored two different ways.
 * The server turns these strings into the canonical encoding (see
 * lib/clinic-time.ts). Zero-padded HH:MM strings sort correctly, so a plain
 * string comparison is a valid ordering check.
 */

const timeString = z
  .string()
  .refine(isTimeString, "Use a 24-hour time such as 09:00 or 14:30");

export const createAvailabilitySlotSchema = z
  .object({
    providerId: z.string().min(1, "Provider is required"),
    dayOfWeek: z.nativeEnum(DayOfWeek),
    startTime: timeString,
    endTime: timeString,
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updateAvailabilitySlotSchema = z
  .object({
    slotId: z.string().min(1, "Invalid slot ID"),
    dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
  })
  .refine(
    (data) =>
      data.startTime && data.endTime ? data.endTime > data.startTime : true,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export const archiveAvailabilitySlotSchema = z.object({
  slotId: z.string().min(1, "Invalid slot ID"),
});

export const restoreAvailabilitySlotSchema = z.object({
  slotId: z.string().min(1, "Invalid slot ID"),
});

export type CreateAvailabilitySlotInput = z.infer<typeof createAvailabilitySlotSchema>;
export type UpdateAvailabilitySlotInput = z.infer<typeof updateAvailabilitySlotSchema>;
export type ArchiveAvailabilitySlotInput = z.infer<typeof archiveAvailabilitySlotSchema>;
export type RestoreAvailabilitySlotInput = z.infer<typeof restoreAvailabilitySlotSchema>;
