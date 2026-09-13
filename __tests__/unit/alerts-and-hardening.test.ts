/**
 * Unit Tests: alerts and final-audit hardening
 *
 * Regressions for:
 * - alert de-duplication matched the appointment id against the alert title,
 *   which never contains it, so every generation run created duplicates;
 * - markAlertRead / dismissAlert updated any alert by id, whoever owned it;
 * - dashboard query actions fell back to clinic-wide data for a PROVIDER
 *   account with no linked provider;
 * - failed sign-ins were never throttled.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";

const mockDb = {
  appointment: {
    findMany: jest.fn() as jest.MockedFunction<any>,
    count: jest.fn() as jest.MockedFunction<any>,
  },
  alert: {
    findFirst: jest.fn() as jest.MockedFunction<any>,
    create: jest.fn() as jest.MockedFunction<any>,
    updateMany: jest.fn() as jest.MockedFunction<any>,
  },
};
jest.mock("@/lib/prisma", () => ({ prisma: mockDb }));

const mockRequireAuth = jest.fn() as jest.MockedFunction<any>;
jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: mockRequireAuth,
  canAccessProviderData: jest.fn(),
}));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { alertService } from "@/lib/services/alert.service";
import { dismissAlert, markAlertRead } from "@/app/actions/alert.actions";
import {
  getAppointments,
  getCalendarAppointments,
  getDashboardStats,
} from "@/app/actions/queries.actions";
import { clearFailedLogins, isLoginBlocked, recordFailedLogin } from "@/lib/rate-limit";

const signInAs = (role: "PROVIDER" | "FRONT_DESK", providerId: string | null) =>
  mockRequireAuth.mockResolvedValue({ user: { id: `user-${role}`, role, providerId } });

const appointment = {
  id: "appt-1",
  scheduledAt: new Date("2026-09-17T05:30:00Z"),
  patient: { firstName: "John", lastName: "Davis" },
};

describe("Alert generation de-duplication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.appointment.findMany.mockResolvedValue([appointment]);
    mockDb.alert.create.mockImplementation(async ({ data }: any) => ({ id: "alert-1", ...data }));
  });

  it("looks for an existing alert by the appointment id in the message", async () => {
    mockDb.alert.findFirst.mockResolvedValue(null);

    await alertService.generateUpcomingAppointmentAlerts("provider-a");

    const where = (mockDb.alert.findFirst.mock.calls[0][0] as any).where;
    expect(where.message).toEqual({ contains: "[ID: appt-1]" });
    expect(where.title).toBeUndefined();
    expect(mockDb.alert.create).toHaveBeenCalledTimes(1);
    expect((mockDb.alert.create.mock.calls[0][0] as any).data.message).toContain("[ID: appt-1]");
  });

  it("doesn't create a second alert when one already exists", async () => {
    mockDb.alert.findFirst.mockResolvedValue({ id: "existing" });

    await alertService.generateUpcomingAppointmentAlerts("provider-a");
    await alertService.generateUrgentAppointmentAlerts("provider-a");

    expect(mockDb.alert.create).not.toHaveBeenCalled();
  });
});

describe("Alert actions are scoped to the owning provider", () => {
  let consoleError: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Failed actions log the error; keep the test output clean.
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    consoleError.mockRestore();
  });

  it("updates only alerts belonging to the signed-in provider", async () => {
    signInAs("PROVIDER", "provider-b");
    mockDb.alert.updateMany.mockResolvedValue({ count: 1 });

    expect((await markAlertRead("alert-1")).success).toBe(true);
    expect((await dismissAlert("alert-1")).success).toBe(true);

    expect(mockDb.alert.updateMany).toHaveBeenCalledTimes(2);
    for (const call of mockDb.alert.updateMany.mock.calls) {
      expect((call[0] as any).where).toEqual({ id: "alert-1", providerId: "provider-b" });
    }
  });

  it("fails for an alert that belongs to another provider", async () => {
    signInAs("PROVIDER", "provider-b");
    mockDb.alert.updateMany.mockResolvedValue({ count: 0 });

    expect(await markAlertRead("alert-of-a")).toEqual({
      success: false,
      error: "Failed to mark alert as read",
    });
    expect(await dismissAlert("alert-of-a")).toEqual({
      success: false,
      error: "Failed to dismiss alert",
    });
  });

  it("refuses accounts without a provider, and empty ids, before writing", async () => {
    signInAs("FRONT_DESK", null);
    expect(await markAlertRead("alert-1")).toEqual({ success: false, error: "Provider ID not found" });

    signInAs("PROVIDER", "provider-b");
    expect((await dismissAlert("")).success).toBe(false);

    expect(mockDb.alert.updateMany).not.toHaveBeenCalled();
  });
});

describe("Dashboard queries for a provider account with no linked provider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    signInAs("PROVIDER", null);
  });

  const cases: Array<[string, () => Promise<unknown>]> = [
    ["getDashboardStats", () => getDashboardStats()],
    ["getAppointments", () => getAppointments({})],
    [
      "getCalendarAppointments",
      () => getCalendarAppointments({ start: new Date(), end: new Date() }),
    ],
  ];

  it.each(cases)("%s refuses instead of returning clinic-wide data", async (_name, call) => {
    expect(await call()).toEqual({ success: false, error: "Provider ID not found" });
    expect(mockDb.appointment.findMany).not.toHaveBeenCalled();
    expect(mockDb.appointment.count).not.toHaveBeenCalled();
  });
});

describe("Failed sign-in lockout", () => {
  it("locks an email after 5 failed attempts, and only that email", () => {
    const email = "lockout-test@example.com";

    for (let i = 0; i < 4; i++) recordFailedLogin(email);
    expect(isLoginBlocked(email)).toBe(false);

    recordFailedLogin(email);
    expect(isLoginBlocked(email)).toBe(true);
    expect(isLoginBlocked("someone-else@example.com")).toBe(false);

    clearFailedLogins(email);
    expect(isLoginBlocked(email)).toBe(false);
  });
});
