/**
 * Unit Tests: Appointment timing rules (lib/appointment-rules.ts)
 *
 * The rules the service enforces and the appointments table uses to decide
 * which actions to offer.
 */

import { describe, it, expect } from "@jest/globals";
import {
  actionBlockedReason,
  canPerform,
  CHECK_IN_OPENS_MINUTES_BEFORE,
} from "@/lib/appointment-rules";

const now = new Date("2026-09-17T05:30:00Z");
/** An appointment starting `offset` minutes from `now`. */
const appt = (status: string, offset: number, duration = 30) => ({
  status,
  scheduledAt: new Date(now.getTime() + offset * 60000),
  duration,
});

describe("Appointment timing rules", () => {
  it("confirm: only before the start time", () => {
    expect(canPerform("confirm", appt("REQUESTED", 1), now)).toBe(true);
    expect(canPerform("confirm", appt("REQUESTED", 0), now)).toBe(false);
    expect(canPerform("confirm", appt("REQUESTED", -60), now)).toBe(false);
  });

  it("check-in: from an hour before the start until the visit ends", () => {
    expect(
      canPerform(
        "checkIn",
        appt("CONFIRMED", CHECK_IN_OPENS_MINUTES_BEFORE + 1),
        now
      )
    ).toBe(false);
    expect(
      canPerform(
        "checkIn",
        appt("CONFIRMED", CHECK_IN_OPENS_MINUTES_BEFORE),
        now
      )
    ).toBe(true);
    expect(canPerform("checkIn", appt("CONFIRMED", -30), now)).toBe(true); // ends exactly now
    expect(canPerform("checkIn", appt("CONFIRMED", -31), now)).toBe(false);
  });

  it("complete: only after the visit has started", () => {
    expect(canPerform("complete", appt("CHECKED_IN", 5), now)).toBe(false);
    expect(canPerform("complete", appt("CHECKED_IN", 0), now)).toBe(false);
    expect(canPerform("complete", appt("CHECKED_IN", -1), now)).toBe(true);
  });

  it("no-show: only after the start time", () => {
    expect(canPerform("noShow", appt("CONFIRMED", 0), now)).toBe(false);
    expect(canPerform("noShow", appt("CONFIRMED", -1), now)).toBe(true);
  });

  it("cancel: a request at any time, a confirmed appointment only before it starts", () => {
    expect(canPerform("cancel", appt("REQUESTED", -30), now)).toBe(true);
    expect(canPerform("cancel", appt("CONFIRMED", 10), now)).toBe(true);
    expect(canPerform("cancel", appt("CONFIRMED", 0), now)).toBe(false);
    expect(canPerform("cancel", appt("CHECKED_IN", 10), now)).toBe(false);
  });

  it("reschedule: not once the patient has checked in", () => {
    expect(canPerform("reschedule", appt("CONFIRMED", 60), now)).toBe(true);
    expect(
      actionBlockedReason("reschedule", appt("CHECKED_IN", -5), now)
    ).toMatch(/can't be rescheduled/);
  });

  it("never offers an action from the wrong status", () => {
    expect(canPerform("complete", appt("CONFIRMED", -5), now)).toBe(false);
    expect(canPerform("checkIn", appt("REQUESTED", 10), now)).toBe(false);
    expect(canPerform("noShow", appt("REQUESTED", -10), now)).toBe(false);
    expect(canPerform("confirm", appt("CANCELLED", 60), now)).toBe(false);
  });

  it("explains why an action is blocked", () => {
    expect(actionBlockedReason("checkIn", appt("CONFIRMED", 120), now)).toMatch(
      /Check-in opens/
    );
    expect(actionBlockedReason("checkIn", appt("CONFIRMED", -45), now)).toMatch(
      /already ended/
    );
    expect(
      actionBlockedReason("checkIn", appt("CONFIRMED", 30), now)
    ).toBeNull();
  });
});
