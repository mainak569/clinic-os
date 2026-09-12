import { prisma } from "@/lib/prisma";
import type { DayOfWeek, AvailabilitySlot } from "@prisma/client";
import { formatSlotTime } from "@/lib/clinic-time";

/**
 * Bulk Availability Service Layer
 * 
 * Handles bulk creation of recurring availability slots
 * Provides collision detection and detailed reporting
 */

export interface BulkCreateResult {
  created: AvailabilitySlot[];
  skipped: SkippedSlot[];
  summary: {
    totalAttempted: number;
    successfullyCreated: number;
    skipped: number;
    errors: number;
  };
}

export interface SkippedSlot {
  dayOfWeek: DayOfWeek;
  startTime: Date;
  endTime: Date;
  reason: string;
  collisionDetails?: {
    existingSlotId: string;
    existingStart: Date;
    existingEnd: Date;
  };
}

export interface DailyScheduleEntry {
  date: Date;
  dayOfWeek: DayOfWeek;
  slots: Array<{
    id: string;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
  }>;
}

export class BulkAvailabilityService {
  /**
   * Create recurring availability slots
   * 
   * Generates slots for specified days of week within date range
   * Handles collision detection and provides detailed reporting
   */
  async bulkCreateAvailability(input: {
    providerId: string;
    daysOfWeek: DayOfWeek[];
    startTime: Date;
    endTime: Date;
    skipCollisions?: boolean;
    overwriteExisting?: boolean;
  }): Promise<BulkCreateResult> {
    const created: AvailabilitySlot[] = [];
    const skipped: SkippedSlot[] = [];
    let errors = 0;

    // One recurring slot per weekday. Slots have no date, so iterating over a
    // date range only produced repeat attempts at the same weekday.
    const days = [...new Set(input.daysOfWeek)];

    for (const dayOfWeek of days) {
      try {
        const hasCollision = await this.checkCollision(
          input.providerId,
          dayOfWeek,
          input.startTime,
          input.endTime
        );

        if (hasCollision && input.overwriteExisting) {
          await this.archiveConflictingSlots(
            input.providerId,
            dayOfWeek,
            input.startTime,
            input.endTime
          );
        } else if (hasCollision) {
          const collisionDetails = await this.getCollisionDetails(
            input.providerId,
            dayOfWeek,
            input.startTime,
            input.endTime
          );
          skipped.push({
            dayOfWeek,
            startTime: input.startTime,
            endTime: input.endTime,
            reason: "Overlaps an existing slot",
            collisionDetails,
          });
          if (!input.skipCollisions) {
            errors++;
          }
          continue;
        }

        const slot = await this.createSlot(
          input.providerId,
          dayOfWeek,
          input.startTime,
          input.endTime
        );
        created.push(slot);
      } catch (error) {
        skipped.push({
          dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          reason: error instanceof Error ? error.message : "Unknown error occurred",
        });
        errors++;
      }
    }

    return {
      created,
      skipped,
      summary: {
        totalAttempted: days.length,
        successfullyCreated: created.length,
        skipped: skipped.length,
        errors,
      },
    };
  }

  /**
   * Get daily schedule for export
   * 
   * Returns all availability slots grouped by date
   */
  async getDailySchedule(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyScheduleEntry[]> {
    // Get all slots for provider
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        providerId,
        isActive: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Generate all dates in range
    const allDates = this.generateAllDates(startDate, endDate);

    // Map slots to dates
    const schedule: DailyScheduleEntry[] = allDates.map((date) => {
      const dayOfWeek = this.getDayOfWeek(date);

      const daySlots = slots
        .filter((slot) => slot.dayOfWeek === dayOfWeek)
        .map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isActive: slot.isActive,
        }));

      return {
        date,
        dayOfWeek,
        slots: daySlots,
      };
    });

    return schedule;
  }

  /**
   * Export schedule to CSV format
   */
  async exportScheduleToCSV(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const schedule = await this.getDailySchedule(
      providerId,
      startDate,
      endDate
    );

    // CSV header
    const header = "Date,Day of Week,Start Time,End Time,Slot ID,Status\n";

    // CSV rows
    const rows = schedule
      .flatMap((day) => {
        if (day.slots.length === 0) {
          // Include days with no slots
          return `${this.formatDate(day.date)},${day.dayOfWeek},No availability,,,\n`;
        }

        return day.slots.map((slot) => {
          return `${this.formatDate(day.date)},${day.dayOfWeek},${this.formatTime(slot.startTime)},${this.formatTime(slot.endTime)},${slot.id},${slot.isActive ? "Active" : "Inactive"}\n`;
        });
      })
      .join("");

    return header + rows;
  }

  /**
   * Export schedule to JSON format
   */
  async exportScheduleToJSON(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<string> {
    const schedule = await this.getDailySchedule(
      providerId,
      startDate,
      endDate
    );

    const formatted = schedule.map((day) => ({
      date: this.formatDate(day.date),
      dayOfWeek: day.dayOfWeek,
      slots: day.slots.map((slot) => ({
        id: slot.id,
        startTime: this.formatTime(slot.startTime),
        endTime: this.formatTime(slot.endTime),
        status: slot.isActive ? "Active" : "Inactive",
      })),
    }));

    return JSON.stringify(formatted, null, 2);
  }

  /**
   * Delete bulk availability slots
   */
  async deleteBulkAvailability(input: {
    providerId: string;
    daysOfWeek: DayOfWeek[];
  }): Promise<{ archived: number }> {
    // Archive all matching slots
    const result = await prisma.availabilitySlot.updateMany({
      where: {
        providerId: input.providerId,
        dayOfWeek: { in: input.daysOfWeek },
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    return { archived: result.count };
  }


  /**
   * Generate all dates within range (for schedule export)
   */
  private generateAllDates(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
  }

  /**
   * Check for collision with existing slots
   */
  private async checkCollision(
    providerId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    const overlapping = await prisma.availabilitySlot.findFirst({
      where: {
        providerId,
        dayOfWeek,
        isActive: true,
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
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
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

    return overlapping !== null;
  }

  /**
   * Get collision details for reporting
   */
  private async getCollisionDetails(
    providerId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date
  ): Promise<SkippedSlot["collisionDetails"]> {
    const overlapping = await prisma.availabilitySlot.findFirst({
      where: {
        providerId,
        dayOfWeek,
        isActive: true,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (!overlapping) {
      return undefined;
    }

    return {
      existingSlotId: overlapping.id,
      existingStart: overlapping.startTime,
      existingEnd: overlapping.endTime,
    };
  }

  /**
   * Archive conflicting slots
   */
  private async archiveConflictingSlots(
    providerId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date
  ): Promise<void> {
    await prisma.availabilitySlot.updateMany({
      where: {
        providerId,
        dayOfWeek,
        isActive: true,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Create a single slot
   */
  private async createSlot(
    providerId: string,
    dayOfWeek: DayOfWeek,
    startTime: Date,
    endTime: Date
  ): Promise<AvailabilitySlot> {
    return prisma.availabilitySlot.create({
      data: {
        providerId,
        dayOfWeek,
        startTime,
        endTime,
        isActive: true,
      },
    });
  }

  /**
   * Get DayOfWeek enum from Date
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
    return days[date.getUTCDay()];
  }



  /**
   * Format date for CSV/JSON (YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  /**
   * Format time for CSV/JSON (HH:MM AM/PM)
   */
  private formatTime(date: Date): string {
    // Slot times are wall-clock values; never format them through a timezone.
    return formatSlotTime(date);
  }
}

// Singleton instance
export const bulkAvailabilityService = new BulkAvailabilityService();
