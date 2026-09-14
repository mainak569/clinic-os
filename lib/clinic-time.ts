import type { DayOfWeek } from "@prisma/client";

/**
 * Clinic time.
 *
 * Availability slots are recurring wall-clock times ("Mondays 09:00–12:00"),
 * not instants. They used to be stored as whatever `new Date()` produced in the
 * browser, then read back with the *server's* local `getHours()`. That broke in
 * three ways, all visible in the live data:
 *
 *  - Two encodings coexisted: seeded slots kept the wall time in the UTC fields,
 *    UI-created slots stored the browser-local instant. The same "09:00" was
 *    two different values.
 *  - Availability depended on the server timezone: correct on a Mac in IST,
 *    shifted by 5h30 on a UTC host such as Vercel.
 *  - Slots carried an arbitrary date part, so the overlap check and the
 *    (providerId, dayOfWeek, startTime, endTime) unique index compared dates
 *    that meant nothing.
 *
 * The canonical form is now: wall-clock time stored on 1970-01-01 in the UTC
 * fields (09:00 -> 1970-01-01T09:00:00.000Z). Appointments stay real instants,
 * and are converted to clinic wall-clock time before comparing with slots.
 */

export const CLINIC_TIME_ZONE =
  process.env.NEXT_PUBLIC_CLINIC_TIMEZONE ||
  process.env.CLINIC_TIMEZONE ||
  "Asia/Kolkata";

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const WEEKDAYS: DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/** "09:30" -> true */
export function isTimeString(value: string): boolean {
  return TIME_RE.test(value);
}

/** "09:30" -> 1970-01-01T09:30:00.000Z (the canonical slot encoding). */
export function timeStringToSlotDate(value: string): Date {
  const match = TIME_RE.exec(value);
  if (!match) {
    throw new Error(`Invalid time "${value}". Use 24-hour HH:MM.`);
  }
  return new Date(Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2])));
}

/** Minutes after midnight of a canonical slot time. */
export function slotMinutes(value: Date | string): number {
  const d = new Date(value);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/** Canonical slot time -> "09:30" (for form inputs). */
export function slotDateToTimeString(value: Date | string): string {
  const minutes = slotMinutes(value);
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

/** Canonical slot time -> "9:30 AM" (for display). Timezone-independent. */
export function formatSlotTime(value: Date | string): string {
  const minutes = slotMinutes(value);
  const h24 = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, "0");
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m} ${period}`;
}

/**
 * Where an instant falls on the clinic's wall clock: its weekday and minutes
 * after midnight in CLINIC_TIME_ZONE. Independent of the server's timezone.
 */
export function clinicWallClock(
  instant: Date,
  timeZone: string = CLINIC_TIME_ZONE
): { dayOfWeek: DayOfWeek; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayIndex = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(get("weekday"));

  return {
    dayOfWeek: WEEKDAYS[weekdayIndex],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/**
 * Format an instant (such as `Appointment.scheduledAt`) on the clinic's clock,
 * e.g. "Sep 17, 2026, 11:00 AM". Server code must use this rather than
 * `toLocaleString()`, which formats in the server's timezone (UTC on Vercel).
 */
export function formatClinicDateTime(instant: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(instant));
}

/** The clinic's calendar date (Y-M-D) containing `instant`, in `timeZone`. */
function clinicCalendarDate(
  instant: Date,
  timeZone: string
): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * The UTC instant that reads as the given wall-clock date/time in `timeZone`.
 *
 * Standard offset-correction technique, needed because there is no timezone
 * database in the JS runtime beyond what `Intl` exposes: guess the instant by
 * treating the wall-clock fields as UTC, see what that guess actually reads
 * as in `timeZone`, and correct by the difference. Works for any zone and
 * DST, since the offset is read at the guessed instant itself.
 */
function zonedWallClockToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string
): Date {
  const guess = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(guess));
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const readAsUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
    ms
  );
  return new Date(guess - (readAsUtc - guess));
}

/**
 * Start of "today" (00:00:00.000) on the clinic's clock, as a UTC instant.
 *
 * `date-fns`' `startOfDay` operates on the server's own timezone, which is
 * whatever the host happens to be set to — Asia/Kolkata on a laptop, UTC on
 * Vercel. Dashboard "today" counts must use the clinic's timezone instead, the
 * same reason `clinicWallClock` exists for availability slots.
 */
export function startOfClinicDay(
  instant: Date,
  timeZone: string = CLINIC_TIME_ZONE
): Date {
  const { year, month, day } = clinicCalendarDate(instant, timeZone);
  return zonedWallClockToUtc(year, month, day, 0, 0, 0, 0, timeZone);
}

/** End of "today" (23:59:59.999) on the clinic's clock, as a UTC instant. */
export function endOfClinicDay(
  instant: Date,
  timeZone: string = CLINIC_TIME_ZONE
): Date {
  const { year, month, day } = clinicCalendarDate(instant, timeZone);
  return zonedWallClockToUtc(year, month, day, 23, 59, 59, 999, timeZone);
}

const WEEKDAY_INDEX: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** Start of this Monday (00:00:00.000) on the clinic's clock, as a UTC instant. */
export function startOfClinicWeek(
  instant: Date,
  timeZone: string = CLINIC_TIME_ZONE
): Date {
  const { dayOfWeek } = clinicWallClock(instant, timeZone);
  const daysSinceMonday = (WEEKDAY_INDEX[dayOfWeek] + 6) % 7; // Mon=0 .. Sun=6
  const roughlyMonday = new Date(
    instant.getTime() - daysSinceMonday * 86_400_000
  );
  return startOfClinicDay(roughlyMonday, timeZone);
}

/** End of this Sunday (23:59:59.999) on the clinic's clock, as a UTC instant. */
export function endOfClinicWeek(
  instant: Date,
  timeZone: string = CLINIC_TIME_ZONE
): Date {
  const monday = startOfClinicWeek(instant, timeZone);
  // A week is never long enough for a DST shift to push this outside Sunday.
  const roughlySunday = new Date(monday.getTime() + 6 * 86_400_000);
  return endOfClinicDay(roughlySunday, timeZone);
}
