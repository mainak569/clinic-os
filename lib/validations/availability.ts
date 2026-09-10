import { z } from "zod";
import { DayOfWeek } from "@prisma/client";

/**
 * Availability Validation Schemas
 * 
 * Validates availability slot operations with business rules
 */

export const createAvailabilitySlotSchema = z.object({
  providerId: z.string().cuid("Invalid provider ID"),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
}).refine(
  (data) => data.endTime > data.startTime,
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

export const updateAvailabilitySlotSchema = z.object({
  slotId: z.string().cuid("Invalid slot ID"),
  dayOfWeek: z.nativeEnum(DayOfWeek).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  {
    message: "End time must be after start time",
    path: ["endTime"],
  }
);

export const archiveAvailabilitySlotSchema = z.object({
  slotId: z.string().cuid("Invalid slot ID"),
});

export const restoreAvailabilitySlotSchema = z.object({
  slotId: z.string().cuid("Invalid slot ID"),
});

export type CreateAvailabilitySlotInput = z.infer<typeof createAvailabilitySlotSchema>;
export type UpdateAvailabilitySlotInput = z.infer<typeof updateAvailabilitySlotSchema>;
export type ArchiveAvailabilitySlotInput = z.infer<typeof archiveAvailabilitySlotSchema>;
export type RestoreAvailabilitySlotInput = z.infer<typeof restoreAvailabilitySlotSchema>;
