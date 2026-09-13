/**
 * Unit Tests: Appointment details view
 *
 * Regressions for two bugs in the appointment details dialog:
 * - the visit-note form was hard-coded hidden, so no provider could write a
 *   note from the UI;
 * - the History tab was always empty because the details query never loaded
 *   appointment history, and the query had no provider isolation.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockAuth = jest.fn() as jest.MockedFunction<any>;
jest.mock("@/auth", () => ({
  auth: mockAuth,
}));

const mockFindUnique = jest.fn() as jest.MockedFunction<any>;
jest.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      findUnique: mockFindUnique,
    },
  },
}));
jest.mock("@/prisma.config", () => ({
  prisma: {},
}));

import { canWriteVisitNote } from "@/lib/visit-note-permissions";
import { appointmentService } from "@/lib/services/appointment.service";
import { getAppointmentById } from "@/app/actions/queries.actions";

const signInAs = (role: "PROVIDER" | "FRONT_DESK", providerId: string | null) =>
  mockAuth.mockResolvedValue({ user: { id: `user-${role}`, role, providerId } });

const appointmentFor = (providerId: string) => ({
  id: "appt-1",
  providerId,
  cost: null,
  visitNote: null,
  patient: { id: "patient-1" },
  provider: { id: providerId },
  appointmentHistory: [
    {
      id: "h1",
      action: "CREATED",
      performedAt: new Date("2026-09-16T05:30:00Z"),
      performer: { id: "user-FRONT_DESK", email: "frontdesk@clinicos.com", provider: null },
    },
  ],
});

describe("canWriteVisitNote", () => {
  it("allows the appointment's own provider", () => {
    expect(canWriteVisitNote("PROVIDER", "provider-a", "provider-a")).toBe(true);
  });

  it("refuses a different provider", () => {
    expect(canWriteVisitNote("PROVIDER", "provider-b", "provider-a")).toBe(false);
  });

  it("refuses front desk, who can only read notes", () => {
    expect(canWriteVisitNote("FRONT_DESK", undefined, "provider-a")).toBe(false);
  });

  it("refuses a provider account with no linked provider", () => {
    expect(canWriteVisitNote("PROVIDER", null, "provider-a")).toBe(false);
    expect(canWriteVisitNote("PROVIDER", "", "")).toBe(false);
  });
});

describe("AppointmentService.getAppointmentDetails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindUnique.mockResolvedValue(null);
  });

  it("loads status history oldest first", async () => {
    await appointmentService.getAppointmentDetails("appt-1");

    const args = mockFindUnique.mock.calls[0][0] as any;
    expect(args.where).toEqual({ id: "appt-1" });
    expect(args.include.appointmentHistory.orderBy).toEqual({ performedAt: "asc" });
  });

  it("selects only safe performer fields, never the whole user record", async () => {
    await appointmentService.getAppointmentDetails("appt-1");

    const performer = (mockFindUnique.mock.calls[0][0] as any).include.appointmentHistory
      .include.performer;
    expect(performer.select).toBeDefined();
    expect(Object.keys(performer.select).sort()).toEqual(["email", "id", "provider"]);
  });
});

describe("getAppointmentById action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the appointment with its history to its own provider", async () => {
    signInAs("PROVIDER", "provider-a");
    mockFindUnique.mockResolvedValue(appointmentFor("provider-a"));

    const result = await getAppointmentById("appt-1");

    expect(result.success).toBe(true);
    expect((result as any).data.appointmentHistory).toHaveLength(1);
    expect((result as any).data.appointmentHistory[0].action).toBe("CREATED");
  });

  it("returns any appointment to front desk", async () => {
    signInAs("FRONT_DESK", null);
    mockFindUnique.mockResolvedValue(appointmentFor("provider-a"));

    const result = await getAppointmentById("appt-1");

    expect(result.success).toBe(true);
  });

  it("hides another provider's appointment as not found", async () => {
    signInAs("PROVIDER", "provider-b");
    mockFindUnique.mockResolvedValue(appointmentFor("provider-a"));

    const result = await getAppointmentById("appt-1");

    expect(result).toEqual({ success: false, error: "Appointment not found" });
  });

  it("reports a missing appointment as not found", async () => {
    signInAs("FRONT_DESK", null);
    mockFindUnique.mockResolvedValue(null);

    const result = await getAppointmentById("missing");

    expect(result).toEqual({ success: false, error: "Appointment not found" });
  });
});
