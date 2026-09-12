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
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday")
  );

  return {
    dayOfWeek: WEEKDAYS[weekdayIndex],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}
