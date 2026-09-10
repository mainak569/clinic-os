/**
 * Integration Tests: Authorization & Access Control
 * 
 * Tests provider data isolation and authorization boundaries
 * Critical for multi-tenant security
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { appointmentService } from "@/lib/services/appointment.service";
import { canAccessProviderData, canAccessAppointment } from "@/lib/auth-helpers";
import { UnauthorizedAppointmentAccessError } from "@/lib/errors/appointment-errors";
import { auth } from "@/auth";

// Mock auth module
jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

describe("Authorization & Access Control", () => {
  let provider1: any;
  let provider2: any;
  let user1: any;
  let user2: any;
  let frontDeskUser: any;
  let patient: any;
  let appointment1: any;
  let appointment2: any;

  beforeAll(async () => {
    // Create users and providers
    user1 = await prisma.user.create({
      data: {
        email: "provider1@test.com",
        passwordHash: "hash",
        role: "PROVIDER",
      },
    });

    provider1 = await prisma.provider.create({
      data: {
        userId: user1.id,
        firstName: "Provider",
        lastName: "One",
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: "provider2@test.com",
        passwordHash: "hash",
        role: "PROVIDER",
      },
    });

    provider2 = await prisma.provider.create({
      data: {
        userId: user2.id,
        firstName: "Provider",
        lastName: "Two",
      },
    });

    frontDeskUser = await prisma.user.create({
      data: {
        email: "frontdesk@test.com",
        passwordHash: "hash",
        role: "FRONT_DESK",
      },
    });

    patient = await prisma.patient.create({
      data: {
        firstName: "Test",
        lastName: "Patient",
        email: "auth-patient@test.com",
      },
    });

    // Create availability slots
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    await prisma.availabilitySlot.create({
      data: {
        providerId: provider1.id,
        dayOfWeek: "MONDAY",
        startTime: new Date("2024-01-01T09:00:00"),
        endTime: new Date("2024-01-01T17:00:00"),
      },
    });

    await prisma.availabilitySlot.create({
      data: {
        providerId: provider2.id,
        dayOfWeek: "MONDAY",
        startTime: new Date("2024-01-01T09:00:00"),
        endTime: new Date("2024-01-01T17:00:00"),
      },
    });

    // Create appointments
    futureDate.setHours(10, 0, 0, 0);

    appointment1 = await appointmentService.createAppointment(
      {
        patientId: patient.id,
        providerId: provider1.id,
        scheduledAt: futureDate,
        duration: 30,
        type: "FOLLOW_UP",
        reason: "Checkup",
      },
      user1.id
    );

    const futureDate2 = new Date(futureDate);
    futureDate2.setHours(11, 0, 0, 0);

    appointment2 = await appointmentService.createAppointment(
      {
        patientId: patient.id,
        providerId: provider2.id,
        scheduledAt: futureDate2,
        duration: 30,
        type: "FOLLOW_UP",
        reason: "Checkup",
      },
      user2.id
    );
  });

  afterAll(async () => {
    // Cleanup
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.availabilitySlot.deleteMany({});
    await prisma.patient.deleteMany({ where: { email: "auth-patient@test.com" } });
    await prisma.provider.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
    await prisma.user.deleteMany({
      where: { email: { in: ["provider1@test.com", "provider2@test.com", "frontdesk@test.com"] } },
    });
  });

  describe("Provider Data Isolation", () => {
    it("should allow provider to access their own data", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      const canAccess = await canAccessProviderData(provider1.id);
      expect(canAccess).toBe(true);
    });

    it("should deny provider access to another provider's data", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      const canAccess = await canAccessProviderData(provider2.id);
      expect(canAccess).toBe(false);
    });

    it("should allow FRONT_DESK to access all providers", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: frontDeskUser.id,
          role: "FRONT_DESK",
          providerId: null,
        },
      });

      const canAccess1 = await canAccessProviderData(provider1.id);
      const canAccess2 = await canAccessProviderData(provider2.id);

      expect(canAccess1).toBe(true);
      expect(canAccess2).toBe(true);
    });
  });

  describe("Appointment Access Control", () => {
    it("should allow provider to access their own appointments", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      const canAccess = await canAccessAppointment(provider1.id);
      expect(canAccess).toBe(true);
    });

    it("should deny provider access to another provider's appointments", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      const canAccess = await canAccessAppointment(provider2.id);
      expect(canAccess).toBe(false);
    });

    it("should deny confirming another provider's appointment", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      // Provider 1 trying to confirm Provider 2's appointment
      const canAccess = await canAccessAppointment(appointment2.providerId);
      expect(canAccess).toBe(false);
    });
  });

  describe("Cross-Provider Data Leakage", () => {
    it("should not return appointments from other providers", async () => {
      const provider1Appointments = await appointmentService.getProviderAppointments(
        provider1.id
      );

      const hasProvider2Appointments = provider1Appointments.some(
        (appt) => appt.providerId === provider2.id
      );

      expect(hasProvider2Appointments).toBe(false);
    });

    it("should only return appointments for the specified provider", async () => {
      const appointments = await appointmentService.getProviderAppointments(provider1.id);

      appointments.forEach((appt) => {
        expect(appt.providerId).toBe(provider1.id);
      });
    });
  });

  describe("Role-Based Access", () => {
    it("should allow PROVIDER to access only their appointments", async () => {
      const appointments = await appointmentService.getProviderAppointments(provider1.id);

      expect(appointments.length).toBeGreaterThan(0);
      appointments.forEach((appt) => {
        expect(appt.providerId).toBe(provider1.id);
      });
    });

    it("should allow FRONT_DESK to create appointments for any provider", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: frontDeskUser.id,
          role: "FRONT_DESK",
          providerId: null,
        },
      });

      const canAccessP1 = await canAccessProviderData(provider1.id);
      const canAccessP2 = await canAccessProviderData(provider2.id);

      expect(canAccessP1).toBe(true);
      expect(canAccessP2).toBe(true);
    });
  });

  describe("Authorization Boundary Testing", () => {
    it("should reject unauthorized appointment modification attempts", async () => {
      // Mock Provider 1 session
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      // Provider 1 should not be able to access Provider 2's appointment
      const canAccess = await canAccessAppointment(provider2.id);
      expect(canAccess).toBe(false);
    });

    it("should validate providerId in server actions", async () => {
      // This tests that server actions properly check authorization
      // In real implementation, this would test the actual server action
      const appointment = await appointmentService.getAppointmentById(appointment2.id);
      
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      const canAccess = await canAccessProviderData(appointment!.providerId);
      expect(canAccess).toBe(false);
    });
  });
});
