/**
 * Unit Tests: Clinic time
 *
 * Availability depends on these conversions being independent of the server's
 * timezone, so every case below passes an explicit zone.
 */

import { describe, it, expect } from "@jest/globals";
import {
  clinicWallClock,
  formatSlotTime,
  isTimeString,
  slotDateToTimeString,
  slotMinutes,
  timeStringToSlotDate,
} from "@/lib/clinic-time";

describe("slot time encoding", () => {
  it("stores wall-clock time on 1970-01-01 in the UTC fields", () => {
    expect(timeStringToSlotDate("09:30").toISOString()).toBe("1970-01-01T09:30:00.000Z");
  });

  it("round-trips HH:MM", () => {
    for (const t of ["00:00", "08:05", "12:00", "17:45", "23:59"]) {
      expect(slotDateToTimeString(timeStringToSlotDate(t))).toBe(t);
    }
  });

  it("reads minutes after midnight from the UTC fields", () => {
    expect(slotMinutes("1970-01-01T13:15:00.000Z")).toBe(795);
  });

  it("formats for display without applying a timezone", () => {
    expect(formatSlotTime(timeStringToSlotDate("00:05"))).toBe("12:05 AM");
    expect(formatSlotTime(timeStringToSlotDate("09:00"))).toBe("9:00 AM");
    expect(formatSlotTime(timeStringToSlotDate("12:00"))).toBe("12:00 PM");
    expect(formatSlotTime(timeStringToSlotDate("13:00"))).toBe("1:00 PM");
  });

  it("rejects malformed times", () => {
    expect(isTimeString("9:00")).toBe(false);
    expect(isTimeString("24:00")).toBe(false);
    expect(isTimeString("09:60")).toBe(false);
    expect(() => timeStringToSlotDate("9am")).toThrow();
  });
});

describe("clinicWallClock", () => {
  // 2026-09-14 is a Monday.
  const instant = new Date("2026-09-14T04:30:00Z");

  it("reads an instant on the clinic's wall clock", () => {
    expect(clinicWallClock(instant, "Asia/Kolkata")).toEqual({ dayOfWeek: "MONDAY", minutes: 600 });
  });

  it("gives a different answer in a different zone, whatever the server's own zone", () => {
    expect(clinicWallClock(instant, "UTC")).toEqual({ dayOfWeek: "MONDAY", minutes: 270 });
    expect(clinicWallClock(instant, "America/New_York")).toEqual({ dayOfWeek: "MONDAY", minutes: 30 });
  });

  it("uses the clinic's weekday when the instant crosses midnight", () => {
    // Sunday 20:00 UTC is already Monday 01:30 in Kolkata.
    expect(clinicWallClock(new Date("2026-09-13T20:00:00Z"), "Asia/Kolkata")).toEqual({
      dayOfWeek: "MONDAY",
      minutes: 90,
    });
  });

  it("reports midnight as minute 0, not 24:00", () => {
    expect(clinicWallClock(new Date("2026-09-14T00:00:00Z"), "UTC").minutes).toBe(0);
  });
});
