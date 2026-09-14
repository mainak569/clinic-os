/**
 * Unit Tests: Availability summary
 *
 * Regression for the booking form's "Available Hours", which printed the first
 * day's hours next to every day: a provider with shorter hours on Friday and
 * the weekend was shown as having Monday's hours all week.
 */

import { describe, it, expect } from "@jest/globals";
import {
  formatMinutesOfDay,
  formatSlotRanges,
  summarizeWeeklyAvailability,
} from "@/lib/availability-summary";

const slot = (dayOfWeek: string, start: string, end: string) => ({
  dayOfWeek,
  startTime: `1970-01-01T${start}:00.000Z`,
  endTime: `1970-01-01T${end}:00.000Z`,
});

describe("Availability summary", () => {
  it("groups days with the same hours and keeps different hours apart", () => {
    const slots = [
      ...["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"].flatMap((day) => [
        slot(day, "08:00", "12:00"),
        slot(day, "13:00", "16:00"),
      ]),
      slot("FRIDAY", "09:00", "17:00"),
      slot("SATURDAY", "09:00", "17:45"),
      slot("SUNDAY", "09:00", "17:45"),
    ];

    expect(summarizeWeeklyAvailability(slots)).toEqual([
      "Mon–Thu: 8:00 AM–12:00 PM, 1:00 PM–4:00 PM",
      "Fri: 9:00 AM–5:00 PM",
      "Sat–Sun: 9:00 AM–5:45 PM",
    ]);
  });

  it("joins non-consecutive days that share hours", () => {
    expect(
      summarizeWeeklyAvailability([
        slot("MONDAY", "09:00", "12:00"),
        slot("WEDNESDAY", "09:00", "12:00"),
        slot("THURSDAY", "09:00", "12:00"),
      ])
    ).toEqual(["Mon, Wed–Thu: 9:00 AM–12:00 PM"]);
  });

  it("orders a day's slots by start time", () => {
    expect(
      formatSlotRanges([
        slot("MONDAY", "13:00", "16:00"),
        slot("MONDAY", "08:00", "12:00"),
      ])
    ).toBe("8:00 AM–12:00 PM, 1:00 PM–4:00 PM");
  });

  it("returns no lines when there are no slots", () => {
    expect(summarizeWeeklyAvailability([])).toEqual([]);
  });

  it("formats minutes after midnight", () => {
    expect(formatMinutesOfDay(16 * 60 + 5)).toBe("4:05 PM");
    expect(formatMinutesOfDay(0)).toBe("12:00 AM");
    expect(formatMinutesOfDay(12 * 60)).toBe("12:00 PM");
  });
});
