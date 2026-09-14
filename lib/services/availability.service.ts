import { prisma } from "@/lib/prisma";
import type { DayOfWeek, AvailabilitySlot } from "@prisma/client";
import {
  AvailabilitySlotNotFoundError,
  OverlappingSlotError,
  SlotHasBookingsError,
} from "@/lib/errors/appointment-errors";
import { clinicWallClock, slotMinutes } from "@/lib/clinic-time";
import {
  formatMinutesOfDay,
  formatSlotRanges,
} from "@/lib/availability-summary";

// Appointments in these statuses still need their slot; CANCELLED, NO_SHOW
// and COMPLETED appointments don't block changing or removing it.
const OPEN_STATUSES = ["REQUESTED", "CONFIRMED", "CHECKED_IN"] as const;

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

    if (slotMinutes(updatedEndTime) <= slotMinutes(updatedStartTime)) {
      throw new Error("End time must be after start time");
    }

    // Reject any change (day, narrower hours, or a later start/earlier end)
    // that would leave an already-booked appointment outside the new window.
    await this.assertNoBookingsOutsideWindow(
      existingSlot.providerId,
      existingSlot.dayOfWeek,
      existingSlot.startTime,
      existingSlot.endTime,
      updatedDayOfWeek,
      updatedStartTime,
      updatedEndTime
    );

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

    await this.assertNoBookedAppointments(
      slot.providerId,
      slot.dayOfWeek,
      slot.startTime,
      slot.endTime
    );

    const archivedSlot = await prisma.availabilitySlot.update({
      where: { id: slotId },
      data: { isActive: false },
    });

    return archivedSlot;
  }

  /**
   * Permanently delete an availability slot.
   *
   * @throws AvailabilitySlotNotFoundError if slot doesn't exist
   * @throws SlotHasBookingsError if the slot still has upcoming appointments
   */
  async deleteSlot(slotId: string): Promise<void> {
    const slot = await prisma.availabilitySlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new AvailabilitySlotNotFoundError(slotId);
    }

    await this.assertNoBookedAppointments(
      slot.providerId,
      slot.dayOfWeek,
      slot.startTime,
      slot.endTime
    );

    await prisma.availabilitySlot.delete({ where: { id: slotId } });
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
   * Future, still-open appointments booked into [startTime, endTime) of
   * dayOfWeek for this provider. Recurring slots have no date, so this
   * matches on the appointment's clinic wall-clock day and time, same as
   * isProviderAvailable.
   */
  private async findBookedAppointmentsInWindow(
    providerId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date
  ) {
    const windowStart = slotMinutes(startTime);
    const windowEnd = slotMinutes(endTime);

    // Appointments are instants, so pull the provider's future open ones and
    // filter by clinic wall clock in JS rather than trying to express
    // timezone-aware day/time extraction in SQL.
    const candidates = await prisma.appointment.findMany({
      where: {
        providerId,
        status: { in: [...OPEN_STATUSES] },
        scheduledAt: { gt: new Date() },
      },
      select: { id: true, scheduledAt: true, duration: true },
    });

    return candidates.filter((appt) => {
      const wall = clinicWallClock(appt.scheduledAt);
      if (wall.dayOfWeek !== dayOfWeek) return false;
      const apptStart = wall.minutes;
      const apptEnd = wall.minutes + appt.duration;
      return apptStart < windowEnd && apptEnd > windowStart;
    });
  }

  /** @throws SlotHasBookingsError if the window has upcoming open appointments. */
  private async assertNoBookedAppointments(
    providerId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    const booked = await this.findBookedAppointmentsInWindow(
      providerId,
      dayOfWeek,
      startTime,
      endTime
    );
    if (booked.length > 0) {
      throw new SlotHasBookingsError(booked.length);
    }
  }

  /**
   * Same as assertNoBookedAppointments, but for an edit: only appointments
   * that would fall OUTSIDE the new window are a problem. An edit that keeps
   * (or grows) coverage of every existing booking is allowed.
   */
  private async assertNoBookingsOutsideWindow(
    providerId: string,
    oldDayOfWeek: DayOfWeek,
    oldStartTime: Date,
    oldEndTime: Date,
    newDayOfWeek: DayOfWeek,
    newStartTime: Date,
    newEndTime: Date
  ): Promise<void> {
    const currentlyBooked = await this.findBookedAppointmentsInWindow(
      providerId,
      oldDayOfWeek,
      oldStartTime,
      oldEndTime
    );
    if (currentlyBooked.length === 0) return;

    const newStart = slotMinutes(newStartTime);
    const newEnd = slotMinutes(newEndTime);
    const orphaned = currentlyBooked.filter((appt) => {
      const wall = clinicWallClock(appt.scheduledAt);
      if (wall.dayOfWeek !== newDayOfWeek) return true;
      const apptStart = wall.minutes;
      const apptEnd = wall.minutes + appt.duration;
      return !(apptStart >= newStart && apptEnd <= newEnd);
    });

    if (orphaned.length > 0) {
      throw new SlotHasBookingsError(orphaned.length);
    }
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
  /**
   * Why a visit doesn't fit the provider's hours, for the booking error.
   *
   * Names the requested window and that day's hours: a bare "not available"
   * didn't say whether the start time or the visit length was the problem.
   */
  async describeUnavailability(
    providerId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<string> {
    const wall = clinicWallClock(scheduledAt);
    const day =
      wall.dayOfWeek.charAt(0) + wall.dayOfWeek.slice(1).toLowerCase();

    const slots = await prisma.availabilitySlot.findMany({
      where: { providerId, dayOfWeek: wall.dayOfWeek, isActive: true },
    });

    if (slots.length === 0) {
      return `The provider has no available hours on ${day}s. Choose another day, or add hours on the Schedule page.`;
    }

    const start = formatMinutesOfDay(wall.minutes);
    const end = formatMinutesOfDay(wall.minutes + duration);
    return `This ${duration}-minute visit would run from ${start} to ${end}, outside the provider's hours on ${day}s (${formatSlotRanges(slots)}). Choose a start time or a shorter duration so the whole visit fits within those hours.`;
  }

  async isProviderAvailable(
    providerId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    // Compare on the clinic's wall clock, not the server's local clock, so the
    // answer is the same on a laptop in IST and on a UTC host.
    const wall = clinicWallClock(scheduledAt);
    const appointmentStart = wall.minutes;
    const appointmentEnd = wall.minutes + duration;

    // A visit that runs past midnight can't fit inside a same-day slot.
    if (appointmentEnd > 24 * 60) {
      return false;
    }

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        providerId,
        dayOfWeek: wall.dayOfWeek,
        isActive: true,
      },
    });

    return slots.some(
      (slot) =>
        appointmentStart >= slotMinutes(slot.startTime) &&
        appointmentEnd <= slotMinutes(slot.endTime)
    );
  }
}

// Singleton instance
export const availabilityService = new AvailabilityService();
