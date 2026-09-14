import { formatSlotTime, slotMinutes } from "@/lib/clinic-time";

/**
 * Readable descriptions of a provider's weekly hours.
 *
 * Shared by the booking form's "Available Hours" summary and the server's
 * "doesn't fit" booking error, so both describe the hours the same way.
 */

export interface SlotLike {
  dayOfWeek: string;
  startTime: Date | string;
  endTime: Date | string;
}

const WEEK = [
  { day: "MONDAY", short: "Mon" },
  { day: "TUESDAY", short: "Tue" },
  { day: "WEDNESDAY", short: "Wed" },
  { day: "THURSDAY", short: "Thu" },
  { day: "FRIDAY", short: "Fri" },
  { day: "SATURDAY", short: "Sat" },
  { day: "SUNDAY", short: "Sun" },
];

/** Minutes after midnight -> "4:05 PM". */
export function formatMinutesOfDay(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m % 60).padStart(2, "0")} ${period}`;
}

/** One day's slots, earliest first: "8:00 AM–12:00 PM, 1:00 PM–4:00 PM". */
export function formatSlotRanges(slots: SlotLike[]): string {
  return [...slots]
    .sort((a, b) => slotMinutes(a.startTime) - slotMinutes(b.startTime))
    .map((s) => `${formatSlotTime(s.startTime)}–${formatSlotTime(s.endTime)}`)
    .join(", ");
}

/**
 * One line per set of identical hours, Monday first. Days without slots are
 * left out. For example:
 *   "Mon–Thu: 8:00 AM–12:00 PM, 1:00 PM–4:00 PM"
 *   "Fri: 9:00 AM–5:00 PM"
 *   "Sat–Sun: 9:00 AM–5:45 PM"
 */
export function summarizeWeeklyAvailability(slots: SlotLike[]): string[] {
  const daysByHours = new Map<string, number[]>();

  WEEK.forEach(({ day }, index) => {
    const daySlots = slots.filter((s) => s.dayOfWeek === day);
    if (daySlots.length === 0) return;
    const hours = formatSlotRanges(daySlots);
    daysByHours.set(hours, [...(daysByHours.get(hours) ?? []), index]);
  });

  return [...daysByHours.entries()].map(
    ([hours, days]) => `${formatDayRuns(days)}: ${hours}`
  );
}

/** Week indexes -> day names, joining consecutive days: [0,1,2,5] -> "Mon–Wed, Sat". */
function formatDayRuns(indexes: number[]): string {
  const runs: string[] = [];
  let start = indexes[0];
  let prev = indexes[0];

  for (const index of [...indexes.slice(1), -1]) {
    if (index === prev + 1) {
      prev = index;
      continue;
    }
    runs.push(
      start === prev
        ? WEEK[start].short
        : `${WEEK[start].short}–${WEEK[prev].short}`
    );
    start = index;
    prev = index;
  }

  return runs.join(", ");
}
