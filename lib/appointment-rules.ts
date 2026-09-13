/**
 * Appointment timing rules
 *
 * Which actions are allowed for an appointment right now, based on its status
 * and the clock. The service enforces these (lib/services/appointment.service.ts)
 * and the appointments table uses them to decide which actions to offer, so the
 * UI never offers something the server will refuse.
 *
 * Times are compared as instants, so the result doesn't depend on the server's
 * or the browser's timezone.
 */

/** How early a patient can be checked in, before the scheduled start. */
export const CHECK_IN_OPENS_MINUTES_BEFORE = 60;

export type AppointmentAction =
  | "confirm"
  | "checkIn"
  | "complete"
  | "noShow"
  | "cancel"
  | "reschedule";

export interface AppointmentTiming {
  status: string;
  scheduledAt: Date | string;
  /** Minutes. */
  duration: number;
}

const MINUTE = 60_000;

/** Statuses each action can start from (mirrors the service's state machine). */
const ALLOWED_FROM: Record<AppointmentAction, string[]> = {
  confirm: ["REQUESTED"],
  checkIn: ["CONFIRMED"],
  complete: ["CHECKED_IN"],
  noShow: ["CONFIRMED"],
  cancel: ["REQUESTED", "CONFIRMED"],
  reschedule: ["REQUESTED", "CONFIRMED"],
};

/**
 * Why `action` isn't allowed for this appointment at `now`, or null if the
 * timing allows it. Status transitions themselves are checked separately by
 * the service's state machine; this covers the rules that depend on the clock.
 */
export function actionBlockedReason(
  action: AppointmentAction,
  appointment: AppointmentTiming,
  now: Date = new Date()
): string | null {
  const start = new Date(appointment.scheduledAt).getTime();
  const end = start + appointment.duration * MINUTE;
  const t = now.getTime();

  switch (action) {
    case "confirm":
      return t >= start
        ? "This appointment's start time has passed, so it can't be confirmed. Cancel or reschedule it instead."
        : null;

    case "checkIn":
      if (t < start - CHECK_IN_OPENS_MINUTES_BEFORE * MINUTE) {
        return `Check-in opens ${CHECK_IN_OPENS_MINUTES_BEFORE} minutes before the appointment.`;
      }
      if (t > end) {
        return "This appointment has already ended. Mark it as a no-show or reschedule it.";
      }
      return null;

    case "complete":
      return t <= start ? "A visit can't be completed before its scheduled start time." : null;

    case "noShow":
      return t <= start ? "Cannot mark appointment as NO_SHOW before the scheduled time" : null;

    case "cancel":
      // An unconfirmed request whose time has passed can still be cleared away;
      // a confirmed one has either happened (check in) or was missed (no-show).
      return appointment.status === "CONFIRMED" && t >= start
        ? "A confirmed appointment can't be cancelled after its start time. Check the patient in or mark it as a no-show."
        : null;

    case "reschedule":
      return appointment.status === "CHECKED_IN"
        ? "The patient has already checked in, so this appointment can't be rescheduled."
        : null;
  }
}

/** True when the status allows the action and the clock does too. */
export function canPerform(
  action: AppointmentAction,
  appointment: AppointmentTiming,
  now: Date = new Date()
): boolean {
  return (
    ALLOWED_FROM[action].includes(appointment.status) &&
    actionBlockedReason(action, appointment, now) === null
  );
}
