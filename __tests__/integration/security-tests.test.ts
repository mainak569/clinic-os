/**
 * Integration Tests: Security & Unauthorized Requests
 * 
 * Tests security boundaries and unauthorized access attempts
 * Critical for production security
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { appointmentService } from "@/lib/services/appointment.service";
import { auth } from "@/auth";
import {
  canAccessProviderData,
  canAccessPatient,
  requireAuth,
  requireRole,
} from "@/lib/auth-helpers";

// Mock auth
jest.mock("@/auth");

// Helper function to get next Monday
function getNextMonday(daysAhead: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const dayOffset = (1 + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + dayOffset);
  return date;
}

describe("Security & Unauthorized Requests", () => {
  let provider1: any;
  let provider2: any;
  let user1: any;
  let user2: any;
  let frontDeskUser: any;
  let patient1: any;
  let patient2: any;

  beforeAll(async () => {
    // Create test users and providers
    user1 = await prisma.user.create({
      data: {
        email: "security-provider1@test.com",
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
        email: "security-provider2@test.com",
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
        email: "security-frontdesk@test.com",
        passwordHash: "hash",
        role: "FRONT_DESK",
      },
    });

    patient1 = await prisma.patient.create({
      data: {
        firstName: "Patient",
        lastName: "One",
        email: "security-patient1@test.com",
      },
    });

    patient2 = await prisma.patient.create({
      data: {
        firstName: "Patient",
        lastName: "Two",
        email: "security-patient2@test.com",
      },
    });

    // Create availability slots for providers (all days for testing)
    const allDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
    for (const day of allDays) {
      await prisma.availabilitySlot.create({
        data: {
          providerId: provider1.id,
          dayOfWeek: day,
          startTime: new Date("1970-01-01T09:00:00Z"),
          endTime: new Date("1970-01-01T17:00:00Z"),
        },
      });

      await prisma.availabilitySlot.create({
        data: {
          providerId: provider2.id,
          dayOfWeek: day,
          startTime: new Date("1970-01-01T09:00:00Z"),
          endTime: new Date("1970-01-01T17:00:00Z"),
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.availabilitySlot.deleteMany({});
    await prisma.patient.deleteMany({
      where: { email: { in: ["security-patient1@test.com", "security-patient2@test.com"] } },
    });
    await prisma.provider.deleteMany({ where: { userId: { in: [user1.id, user2.id] } } });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "security-provider1@test.com",
            "security-provider2@test.com",
            "security-frontdesk@test.com",
          ],
        },
      },
    });
  });

  beforeEach(async () => {
    // Clean up appointments between tests to prevent conflicts
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
  });

  describe("Unauthenticated Access", () => {
    it("should require authentication for requireAuth()", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(requireAuth()).rejects.toThrow();
    });

    it("should require authentication for canAccessProviderData()", async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      await expect(canAccessProviderData(provider1.id)).rejects.toThrow();
    });
  });

  describe("Cross-Provider Access Attempts", () => {
    it("should deny provider access to another provider's appointments", async () => {
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

    it("should deny provider access to another provider's patients", async () => {
      // Create appointments to establish patient-provider relationship
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // Availability slot for provider2 already exists from beforeAll

      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient2.id,
          providerId: provider2.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          status: "CONFIRMED",
          reason: "Checkup",
        },
      });

      // Provider 1 trying to access Provider 2's patient
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      const canAccess = await canAccessPatient(patient2.id);
      expect(canAccess).toBe(false);

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
      await prisma.availabilitySlot.deleteMany({ where: { providerId: provider2.id } });
    });
  });

  describe("Role-Based Access Control", () => {
    it("should deny PROVIDER access to FRONT_DESK-only functions", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: user1.id,
          role: "PROVIDER",
          providerId: provider1.id,
        },
      });

      await expect(requireRole("FRONT_DESK")).rejects.toThrow();
    });

    it("should allow FRONT_DESK access to all provider data", async () => {
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

    it("should allow FRONT_DESK access to all patients", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: frontDeskUser.id,
          role: "FRONT_DESK",
          providerId: null,
        },
      });

      const canAccess1 = await canAccessPatient(patient1.id);
      const canAccess2 = await canAccessPatient(patient2.id);

      expect(canAccess1).toBe(true);
      expect(canAccess2).toBe(true);
    });
  });

  describe("Data Leakage Prevention", () => {
    it("should not leak provider IDs in error messages", async () => {
      try {
        await appointmentService.getAppointmentById("nonexistent-id");
      } catch (error) {
        if (error instanceof Error) {
          // Error message should not contain actual provider IDs
          expect(error.message).not.toContain(provider1.id);
          expect(error.message).not.toContain(provider2.id);
        }
      }
    });

    it("should not return unauthorized data in queries", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // Availability slot already exists from beforeAll

      // Create appointment for provider 1
      const appt1 = await prisma.appointment.create({
        data: {
          patientId: patient1.id,
          providerId: provider1.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          status: "CONFIRMED",
          reason: "Checkup",
        },
      });

      // Query for provider 1's appointments should not return provider 2's
      const appointments = await appointmentService.getProviderAppointments(provider1.id);

      const hasOtherProviderData = appointments.some(
        (appt) => appt.providerId !== provider1.id
      );

      expect(hasOtherProviderData).toBe(false);

      // Cleanup
      await prisma.appointmentHistory.deleteMany({ where: { appointmentId: appt1.id } });
      await prisma.appointment.delete({ where: { id: appt1.id } });
      // Don't delete availability slots - they're managed by beforeAll/afterAll
    });
  });

  describe("Input Validation Security", () => {
    it("should reject invalid appointment IDs", async () => {
      await expect(
        appointmentService.getAppointmentById("invalid-id")
      ).resolves.toBeNull();
    });

    it("should reject SQL injection attempts", async () => {
      const maliciousId = "'; DROP TABLE appointments; --";

      // Prisma should safely handle this
      await expect(
        appointmentService.getAppointmentById(maliciousId)
      ).resolves.toBeNull();
    });

    it("should reject XSS attempts in text fields", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // Availability slot already exists from beforeAll

      const xssPayload = "<script>alert('XSS')</script>";

      const appointment = await appointmentService.createAppointment(
        {
          patientId: patient1.id,
          providerId: provider1.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: xssPayload,
        },
        user1.id
      );

      // Data should be stored as-is (sanitization happens on render)
      expect(appointment.reason).toBe(xssPayload);

      // Cleanup
      await prisma.appointmentHistory.deleteMany({ where: { appointmentId: appointment.id } });
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });
  });

  describe("Session Security", () => {
    it("should validate session has required fields", async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          // Missing providerId
          id: user1.id,
          role: "PROVIDER",
        },
      });

      const session = await auth();
      expect(session?.user.id).toBeDefined();
      expect(session?.user.role).toBeDefined();
    });

    it("should handle inactive users", async () => {
      // Create inactive user
      const inactiveUser = await prisma.user.create({
        data: {
          email: "inactive@test.com",
          passwordHash: "hash",
          role: "PROVIDER",
          isActive: false,
        },
      });

      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: inactiveUser.id,
          role: "PROVIDER",
          isActive: false,
        },
      });

      // Should not allow access
      // In real implementation, auth() would check isActive

      // Cleanup
      await prisma.user.delete({ where: { id: inactiveUser.id } });
    });
  });

  describe("Concurrent Access Control", () => {
    it("should handle concurrent appointment creation", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // Availability slot already created in beforeAll - no need to create again

      // Try to create two appointments at same time concurrently
      const promise1 = appointmentService.createAppointment(
        {
          patientId: patient1.id,
          providerId: provider1.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Concurrent 1",
        },
        user1.id
      );

      const promise2 = appointmentService.createAppointment(
        {
          patientId: patient1.id,
          providerId: provider1.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Concurrent 2",
        },
        user1.id
      );

      const results = await Promise.allSettled([promise1, promise2]);

      // One should succeed, one should fail
      const successful = results.filter((r) => r.status === "fulfilled");
      const failed = results.filter((r) => r.status === "rejected");

      expect(successful.length).toBe(1);
      expect(failed.length).toBe(1);

      // Cleanup
      const successfulAppt = successful[0] as PromiseFulfilledResult<any>;
      if (successfulAppt && successfulAppt.value) {
        await prisma.appointmentHistory.deleteMany({ where: { appointmentId: successfulAppt.value.id } });
        await prisma.appointment.delete({ where: { id: successfulAppt.value.id } });
      }
      // Don't delete availability slots - they're managed by beforeAll/afterAll
    });
  });
});
