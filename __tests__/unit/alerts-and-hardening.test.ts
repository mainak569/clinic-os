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
    findMany: jest.fn() as jest.MockedFunction<any>,
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

describe("Unconfirmed alerts follow the appointment's status", () => {
  // Regression for Goal 10: confirming an appointment left its "unconfirmed"
  // alert in the list, and the badge counted alerts the list didn't show.
  const alertFor = (appointmentId: string | null, priority = "MEDIUM") => ({
    id: `alert-${appointmentId ?? "no-id"}`,
    type: "APPOINTMENT_REMINDER",
    priority,
    title: "Unconfirmed: John Davis",
    message: appointmentId
      ? `Appointment is still REQUESTED. [ID: ${appointmentId}]`
      : "Upcoming Appointment",
    createdAt: new Date("2026-09-13T10:00:00Z"),
    isRead: false,
  });
  const statusOf: Record<string, string> = {
    "appt-requested": "REQUESTED",
    "appt-confirmed": "CONFIRMED",
    "appt-cancelled": "CANCELLED",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.alert.findMany.mockResolvedValue([
      alertFor("appt-requested"),
      alertFor("appt-confirmed", "HIGH"),
      alertFor("appt-cancelled"),
      alertFor(null),
    ]);
    mockDb.appointment.findMany.mockImplementation(async ({ where }: any) => {
      const ids: string[] = where?.id?.in ?? [];
      return ids
        .filter((id) => statusOf[id])
        .map((id) => ({
          id,
          status: statusOf[id],
          scheduledAt: new Date(),
          patient: { firstName: "John", lastName: "Davis" },
        }));
    });
  });

  it("lists only alerts whose appointment is still REQUESTED", async () => {
    const alerts = await alertService.getProviderAlerts("provider-a");
    expect(alerts.map((a) => a.appointmentId)).toEqual(["appt-requested"]);
  });

  it("fetches every linked appointment in one query, not one per alert", async () => {
    // Regression: this used to call prisma.appointment.findUnique once per
    // alert, on a path the header bell polls every 30 seconds.
    await alertService.getProviderAlerts("provider-a");

    expect(mockDb.appointment.findMany).toHaveBeenCalledTimes(1);
    const where = (mockDb.appointment.findMany.mock.calls[0][0] as any).where;
    expect(new Set(where.id.in)).toEqual(
      new Set(["appt-requested", "appt-confirmed", "appt-cancelled"])
    );
  });

  it("counts exactly what the list shows, so the badge can't disagree with it", async () => {
    const [alerts, count] = [
      await alertService.getProviderAlerts("provider-a"),
      await alertService.getUnreadCount("provider-a"),
    ];
    expect(count).toBe(alerts.length);
    expect(count).toBe(1);
  });

  it("creates the urgent alert only for appointments starting within the next hour", async () => {
    mockDb.appointment.findMany.mockResolvedValue([]);
    const before = Date.now();

    await alertService.generateUrgentAppointmentAlerts("provider-a");

    const where = (mockDb.appointment.findMany.mock.calls[0][0] as any).where;
    expect(where.status).toBe("REQUESTED");
    expect(where.scheduledAt.gte).toBeUndefined();
    const from = (where.scheduledAt.gt as Date).getTime();
    const to = (where.scheduledAt.lte as Date).getTime();
    expect(Math.abs(from - before)).toBeLessThan(5000);
    expect(to - from).toBe(60 * 60 * 1000);
  });
});
