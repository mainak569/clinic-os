import { prisma } from "@/lib/prisma";
import type { DayOfWeek, AvailabilitySlot } from "@prisma/client";
import {
  AvailabilitySlotNotFoundError,
  OverlappingSlotError,
} from "@/lib/errors/appointment-errors";

/**
 * Availability Service Layer
 * 
 * Handles all business logic for provider availability management
 * Separated from authorization - call with pre-authorized data
 */

export class AvailabilityService {
  /**
   * Create a new availability slot
   * 
   * @throws OverlappingSlotError if slot overlaps with existing slot
   */
  async createSlot(input: {
    providerId: string;
    dayOfWeek: DayOfWeek;
    startTime: Date;
    endTime: Date;
  }): Promise<AvailabilitySlot> {
    // Check for overlapping slots
    const hasOverlap = await this.checkForOverlap(
      input.providerId,
      input.dayOfWeek,
      input.startTime,
      input.endTime
    );

    if (hasOverlap) {
      throw new OverlappingSlotError();
    }

    // Create the slot
    const slot = await prisma.availabilitySlot.create({
      data: {
        providerId: input.providerId,
        dayOfWeek: input.dayOfWeek,
        startTime: input.startTime,
        endTime: input.endTime,
        isActive: true,
      },
    });

    return slot;
  }

  /**
   * Update an existing availability slot
   * 
   * @throws AvailabilitySlotNotFoundError if slot doesn't exist
   * @throws OverlappingSlotError if update causes overlap
   */
  async updateSlot(
    slotId: string,
    input: {
      dayOfWeek?: DayOfWeek;
      startTime?: Date;
      endTime?: Date;
    }
  ): Promise<AvailabilitySlot> {
    // Get existing slot
    const existingSlot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!existingSlot) {
      throw new AvailabilitySlotNotFoundError(slotId);
    }

    // Prepare updated values
    const updatedDayOfWeek = input.dayOfWeek ?? existingSlot.dayOfWeek;
    const updatedStartTime = input.startTime ?? existingSlot.startTime;
    const updatedEndTime = input.endTime ?? existingSlot.endTime;

    // Check for overlapping slots (excluding current slot)
    const hasOverlap = await this.checkForOverlap(
      existingSlot.providerId,
      updatedDayOfWeek,
      updatedStartTime,
      updatedEndTime,
      slotId
    );

    if (hasOverlap) {
      throw new OverlappingSlotError();
    }

    // Update the slot
    const updatedSlot = await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: {
        dayOfWeek: updatedDayOfWeek,
        startTime: updatedStartTime,
        endTime: updatedEndTime,
      },
    });

    return updatedSlot;
  }

  /**
   * Archive (soft delete) an availability slot
   * 
   * @throws AvailabilitySlotNotFoundError if slot doesn't exist
   */
  async archiveSlot(slotId: string): Promise<AvailabilitySlot> {
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new AvailabilitySlotNotFoundError(slotId);
    }

    const archivedSlot = await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { isActive: false },
    });

    return archivedSlot;
  }

  /**
   * Restore an archived availability slot
   * 
   * @throws AvailabilitySlotNotFoundError if slot doesn't exist
   * @throws OverlappingSlotError if restoration causes overlap
   */
  async restoreSlot(slotId: string): Promise<AvailabilitySlot> {
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new AvailabilitySlotNotFoundError(slotId);
    }

    // Check for overlapping active slots
    const hasOverlap = await this.checkForOverlap(
      slot.providerId,
      slot.dayOfWeek,
      slot.startTime,
      slot.endTime,
      slotId
    );

    if (hasOverlap) {
      throw new OverlappingSlotError();
    }

    const restoredSlot = await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { isActive: true },
    });

    return restoredSlot;
  }

  /**
   * Get all slots for a provider
   */
  async getProviderSlots(
    providerId: string,
    includeInactive = false
  ): Promise<AvailabilitySlot[]> {
    return prisma.availabilitySlot.findMany({
      where: {
        providerId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
  }

  /**
   * Get a single slot by ID
   */
  async getSlotById(slotId: string): Promise<AvailabilitySlot | null> {
    return prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });
  }

  /**
   * Check if a time slot overlaps with existing active slots
   * 
   * @param excludeSlotId - Slot ID to exclude from overlap check (for updates)
   */
  private async checkForOverlap(
    providerId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date,
    excludeSlotId?: string
  ): Promise<boolean> {
    const overlappingSlots = await prisma.availabilitySlot.findMany({
      where: {
        providerId,
        dayOfWeek,
        isActive: true,
        ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
        OR: [
          // New slot starts during existing slot
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          // New slot ends during existing slot
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          // New slot completely contains existing slot
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return overlappingSlots.length > 0;
  }

  /**
   * Check if provider is available at a specific time
   */
  async isProviderAvailable(
    providerId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    const dayOfWeek = this.getDayOfWeek(scheduledAt);
    const appointmentEndTime = new Date(
      scheduledAt.getTime() + duration * 60000
    );

    // Get provider's availability for the day
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        providerId,
        dayOfWeek,
        isActive: true,
      },
    });

    // Check if appointment falls within any slot
    for (const slot of slots) {
      const slotStart = this.combineDateAndTime(scheduledAt, slot.startTime);
      const slotEnd = this.combineDateAndTime(scheduledAt, slot.endTime);

      if (scheduledAt >= slotStart && appointmentEndTime <= slotEnd) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper: Get DayOfWeek enum from Date
   */
  private getDayOfWeek(date: Date): DayOfWeek {
    const days: DayOfWeek[] = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    return days[date.getDay()];
  }

  /**
   * Helper: Combine date and time
   */
  private combineDateAndTime(date: Date, time: Date): Date {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(0);
    combined.setMilliseconds(0);
    return combined;
  }
}

// Singleton instance
export const availabilityService = new AvailabilityService();
