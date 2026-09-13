/**
 * Unit Tests: Availability Service
 *
 * Tests for lib/services/availability.service.ts
 *
 * Regression coverage for a bug found in the pre-submission audit: a slot
 * could be edited, archived or deleted even while it still had an upcoming
 * booked appointment, silently leaving that appointment outside the
 * provider's stated hours.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { SlotHasBookingsError, OverlappingSlotError } from "@/lib/errors/appointment-errors";

const mockSlotFindUnique = jest.fn() as jest.MockedFunction<any>;
const mockSlotFindMany = jest.fn() as jest.MockedFunction<any>;
const mockSlotUpdate = jest.fn() as jest.MockedFunction<any>;
const mockSlotDelete = jest.fn() as jest.MockedFunction<any>;
const mockAppointmentFindMany = jest.fn() as jest.MockedFunction<any>;

jest.mock("@/lib/prisma", () => ({
  prisma: {
    availabilitySlot: {
      findUnique: mockSlotFindUnique,
      findMany: mockSlotFindMany,
      update: mockSlotUpdate,
      delete: mockSlotDelete,
    },
    appointment: {
      findMany: mockAppointmentFindMany,
    },
  },
}));

import { availabilityService } from "@/lib/services/availability.service";

// A Monday 09:00-12:00 slot (canonical wall-clock encoding, 1970-01-01).
const SLOT_ID = "slot-1";
const slot = (overrides: Partial<{ startTime: Date; endTime: Date; dayOfWeek: string }> = {}) => ({
  id: SLOT_ID,
  providerId: "provider-a",
  dayOfWeek: "MONDAY",
  startTime: new Date("1970-01-01T09:00:00Z"),
  endTime: new Date("1970-01-01T12:00:00Z"),
  isActive: true,
  ...overrides,
});

// An appointment on a future Monday at 09:30 clinic time, 30 minutes long.
// clinicWallClock reads CLINIC_TIMEZONE from the environment (set by
// __tests__/setup.ts to the host's own zone), so build the instant from
// local wall-clock parts rather than a fixed UTC offset.
function futureMondayAt(hour: number, minute: number, daysAhead = 14): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const dayOffset = (1 + 7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const bookedAppointment = (overrides: Partial<{ scheduledAt: Date; duration: number }> = {}) => ({
  id: "appt-1",
  scheduledAt: futureMondayAt(9, 30),
  duration: 30,
  ...overrides,
});

describe("AvailabilityService: guarding booked slots", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSlotFindMany.mockResolvedValue([]); // no overlaps by default
  });

  describe("updateSlot", () => {
    it("refuses to narrow a slot so a booked appointment falls outside it", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([bookedAppointment()]); // 09:30

      await expect(
        availabilityService.updateSlot(SLOT_ID, { startTime: new Date("1970-01-01T10:00:00Z") })
      ).rejects.toThrow(SlotHasBookingsError);

      expect(mockSlotUpdate).not.toHaveBeenCalled();
    });

    it("refuses to move a slot to a different day when a booking depends on the old day", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([bookedAppointment()]);

      await expect(
        availabilityService.updateSlot(SLOT_ID, { dayOfWeek: "TUESDAY" as any })
      ).rejects.toThrow(SlotHasBookingsError);
    });

    it("allows widening a slot that still covers every existing booking", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([bookedAppointment()]); // 09:30
      mockSlotUpdate.mockResolvedValue({ ...slot(), startTime: new Date("1970-01-01T08:00:00Z") });

      const result = await availabilityService.updateSlot(SLOT_ID, {
        startTime: new Date("1970-01-01T08:00:00Z"),
      });

      expect(result.id).toBe(SLOT_ID);
      expect(mockSlotUpdate).toHaveBeenCalled();
    });

    it("allows editing a slot with no bookings", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([]);
      mockSlotUpdate.mockResolvedValue(slot({ startTime: new Date("1970-01-01T10:00:00Z") }));

      const result = await availabilityService.updateSlot(SLOT_ID, {
        startTime: new Date("1970-01-01T10:00:00Z"),
      });

      expect(result).toBeDefined();
      expect(mockSlotUpdate).toHaveBeenCalled();
    });

    it("ignores cancelled and no-show appointments when checking for bookings", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      // The service only fetches OPEN_STATUSES appointments, so a mock
      // returning none here simulates a cancelled appointment being filtered
      // out server-side.
      mockAppointmentFindMany.mockResolvedValue([]);
      mockSlotUpdate.mockResolvedValue(slot({ startTime: new Date("1970-01-01T10:00:00Z") }));

      await expect(
        availabilityService.updateSlot(SLOT_ID, { startTime: new Date("1970-01-01T10:00:00Z") })
      ).resolves.toBeDefined();
    });

    it("still rejects overlapping slots independently of the booking check", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([]);
      mockSlotFindMany.mockResolvedValue([{ id: "other-slot" }]); // overlap found

      await expect(
        availabilityService.updateSlot(SLOT_ID, { startTime: new Date("1970-01-01T08:00:00Z") })
      ).rejects.toThrow(OverlappingSlotError);
    });
  });

  describe("archiveSlot", () => {
    it("refuses to archive a slot with an upcoming booked appointment", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([bookedAppointment()]);

      await expect(availabilityService.archiveSlot(SLOT_ID)).rejects.toThrow(SlotHasBookingsError);
      expect(mockSlotUpdate).not.toHaveBeenCalled();
    });

    it("archives a slot with no bookings", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([]);
      mockSlotUpdate.mockResolvedValue(slot({ }));

      await expect(availabilityService.archiveSlot(SLOT_ID)).resolves.toBeDefined();
      expect(mockSlotUpdate).toHaveBeenCalledWith({
        where: { id: SLOT_ID },
        data: { isActive: false },
      });
    });
  });

  describe("deleteSlot", () => {
    it("refuses to permanently delete a slot with an upcoming booked appointment", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([bookedAppointment()]);

      await expect(availabilityService.deleteSlot(SLOT_ID)).rejects.toThrow(SlotHasBookingsError);
      expect(mockSlotDelete).not.toHaveBeenCalled();
    });

    it("deletes a slot with no bookings", async () => {
      mockSlotFindUnique.mockResolvedValue(slot());
      mockAppointmentFindMany.mockResolvedValue([]);
      mockSlotDelete.mockResolvedValue(slot());

      await expect(availabilityService.deleteSlot(SLOT_ID)).resolves.toBeUndefined();
      expect(mockSlotDelete).toHaveBeenCalledWith({ where: { id: SLOT_ID } });
    });
  });
});
