/**
 * Unit Tests: Clinic time
 *
 * Availability depends on these conversions being independent of the server's
 * timezone, so every case below passes an explicit zone.
 */

import { describe, it, expect } from "@jest/globals";
import {
  clinicWallClock,
  endOfClinicDay,
  endOfClinicWeek,
  formatSlotTime,
  isTimeString,
  slotDateToTimeString,
  slotMinutes,
  startOfClinicDay,
  startOfClinicWeek,
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

describe("clinic day/week boundaries", () => {
  // Regression for Goal 8 / G8-1: getDashboardStats used to compute "today"
  // and "this week" with date-fns' startOfDay/startOfWeek, which read the
  // *server's* timezone. That's Asia/Kolkata on a laptop (so it accidentally
  // looked right in dev) but UTC on Vercel, where these boundaries would be
  // wrong by the clinic's UTC offset. Every case here passes an explicit
  // zone so the test doesn't depend on the machine running it either.

  it("gives Kolkata midnight-to-midnight for a day, as UTC instants", () => {
    // Monday 2026-09-14, 10:00 IST.
    const instant = new Date("2026-09-14T04:30:00Z");
    expect(startOfClinicDay(instant, "Asia/Kolkata").toISOString()).toBe(
      "2026-09-13T18:30:00.000Z"
    );
    expect(endOfClinicDay(instant, "Asia/Kolkata").toISOString()).toBe(
      "2026-09-14T18:29:59.999Z"
    );
  });

  it("gives a different day boundary in a different zone, for the same instant", () => {
    const instant = new Date("2026-09-14T04:30:00Z");
    expect(startOfClinicDay(instant, "UTC").toISOString()).toBe("2026-09-14T00:00:00.000Z");
    expect(endOfClinicDay(instant, "UTC").toISOString()).toBe("2026-09-14T23:59:59.999Z");
  });

  it("buckets a late-night IST appointment into the correct clinic day even though its UTC date differs", () => {
    // 2026-09-14T20:30:00Z is 2026-09-15, 02:00 IST — the *next* clinic day,
    // even though the UTC calendar date is still the 14th. This is exactly
    // the case date-fns' server-timezone startOfDay gets wrong on a UTC host.
    const lateNight = new Date("2026-09-14T20:30:00Z");
    const start = startOfClinicDay(lateNight, "Asia/Kolkata");
    const end = endOfClinicDay(lateNight, "Asia/Kolkata");
    expect(start.toISOString()).toBe("2026-09-14T18:30:00.000Z"); // Sep 15, 00:00 IST
    expect(end.toISOString()).toBe("2026-09-15T18:29:59.999Z"); // Sep 15, 23:59:59.999 IST
    expect(lateNight >= start && lateNight <= end).toBe(true);
    // And it's outside the *previous* UTC-naive day's boundary.
    expect(lateNight > endOfClinicDay(new Date("2026-09-13T04:30:00Z"), "Asia/Kolkata")).toBe(true);
  });

  it("gives Monday-to-Sunday for the week, regardless of which day of it is passed in", () => {
    const monday = new Date("2026-09-14T04:30:00Z"); // Monday, 10:00 IST
    const sunday = new Date("2026-09-20T10:00:00Z"); // Sunday, 15:30 IST, same week

    for (const instant of [monday, sunday]) {
      expect(startOfClinicWeek(instant, "Asia/Kolkata").toISOString()).toBe(
        "2026-09-13T18:30:00.000Z" // Monday 00:00 IST
      );
      expect(endOfClinicWeek(instant, "Asia/Kolkata").toISOString()).toBe(
        "2026-09-20T18:29:59.999Z" // Sunday 23:59:59.999 IST
      );
    }
  });
});
