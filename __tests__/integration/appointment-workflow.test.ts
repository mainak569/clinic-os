/**
 * Integration Tests: Appointment Workflows
 * 
 * Tests complete appointment lifecycles with database
 * These tests require a test database connection
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { appointmentService } from "@/lib/services/appointment.service";
import { availabilityService } from "@/lib/services/availability.service";

describe("Appointment Workflow Integration Tests", () => {
  let testProvider: any;
  let testPatient: any;
  let testUser: any;

  beforeAll(async () => {
    // Create test fixtures
    testUser = await prisma.user.create({
      data: {
        email: "test-provider@test.com",
        passwordHash: "test-hash",
        role: "PROVIDER",
      },
    });

    testProvider = await prisma.provider.create({
      data: {
        userId: testUser.id,
        firstName: "Test",
        lastName: "Provider",
      },
    });

    testPatient = await prisma.patient.create({
      data: {
        firstName: "Test",
        lastName: "Patient",
        email: "test-patient@test.com",
      },
    });

    // Create availability
    await availabilityService.createSlot({
      providerId: testProvider.id,
      dayOfWeek: "MONDAY",
      startTime: new Date("2024-01-01T09:00:00"),
      endTime: new Date("2024-01-01T17:00:00"),
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.availabilitySlot.deleteMany({});
    await prisma.patient.deleteMany({});
    await prisma.provider.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean appointments between tests
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
  });

  describe("Happy Path: Complete Appointment Lifecycle", () => {
    it("should complete full workflow: Create → Confirm → CheckIn → Complete", async () => {
      // Get next Monday
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
      nextMonday.setHours(10, 0, 0, 0);

      // Step 1: Create appointment (REQUESTED)
      const created = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: nextMonday,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Regular checkup",
        },
        testUser.id
      );

      expect(created.status).toBe("REQUESTED");

      // Step 2: Confirm (REQUESTED → CONFIRMED)
      const confirmed = await appointmentService.confirmAppointment(
        created.id,
        testUser.id
      );

      expect(confirmed.status).toBe("CONFIRMED");

      // Step 3: Check in (CONFIRMED → CHECKED_IN)
      const checkedIn = await appointmentService.checkInAppointment(
        created.id,
        testUser.id
      );

      expect(checkedIn.status).toBe("CHECKED_IN");
      expect(checkedIn.checkedInAt).toBeTruthy();

      // Step 4: Complete (CHECKED_IN → COMPLETED)
      const completed = await appointmentService.completeAppointment(
        created.id,
        testUser.id
      );

      expect(completed.status).toBe("COMPLETED");
      expect(completed.checkedOutAt).toBeTruthy();

      // Verify audit trail
      const history = await prisma.appointmentHistory.findMany({
        where: { appointmentId: created.id },
        orderBy: { performedAt: "asc" },
      });

      expect(history).toHaveLength(4);
      expect(history[0].action).toBe("CREATED");
      expect(history[1].action).toBe("CONFIRMED");
      expect(history[2].action).toBe("CHECKED_IN");
      expect(history[3].action).toBe("COMPLETED");
    });
  });

  describe("No-Show Path", () => {
    it("should handle no-show workflow correctly", async () => {
      // Create appointment in the past
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      // Set to Monday using getDay() and setDate
      const dayOffset = (pastDate.getDay() === 0 ? -6 : 1 - pastDate.getDay());
      pastDate.setDate(pastDate.getDate() + dayOffset);
      pastDate.setHours(10, 0, 0, 0);

      const created = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: pastDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Checkup",
        },
        testUser.id
      );

      // Confirm
      await appointmentService.confirmAppointment(created.id, testUser.id);

      // Mark no-show
      const noShow = await appointmentService.markNoShow(
        created.id,
        "Patient did not arrive",
        testUser.id
      );

      expect(noShow.status).toBe("NO_SHOW");

      // Verify cannot transition from NO_SHOW
      await expect(
        appointmentService.completeAppointment(created.id, testUser.id)
      ).rejects.toThrow();
    });
  });

  describe("Cancellation Path", () => {
    it("should allow cancellation before check-in", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Set to next Monday
      const dayOffset = (1 + 7 - futureDate.getDay()) % 7 || 7;
      futureDate.setDate(futureDate.getDate() + dayOffset);
      futureDate.setHours(10, 0, 0, 0);

      const created = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Checkup",
        },
        testUser.id
      );

      await appointmentService.confirmAppointment(created.id, testUser.id);

      const cancelled = await appointmentService.cancelAppointment(
        created.id,
        "Patient requested cancellation",
        testUser.id
      );

      expect(cancelled.status).toBe("CANCELLED");
    });

    it("should prevent cancellation after check-in", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Set to next Monday
      const dayOffset = (1 + 7 - futureDate.getDay()) % 7 || 7;
      futureDate.setDate(futureDate.getDate() + dayOffset);
      futureDate.setHours(10, 0, 0, 0);

      const created = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Checkup",
        },
        testUser.id
      );

      await appointmentService.confirmAppointment(created.id, testUser.id);
      await appointmentService.checkInAppointment(created.id, testUser.id);

      await expect(
        appointmentService.cancelAppointment(
          created.id,
          "Late cancellation",
          testUser.id
        )
      ).rejects.toThrow("Cannot cancel appointment after patient has been checked in");
    });
  });

  describe("Duplicate Booking Prevention", () => {
    it("should prevent double-booking same time slot", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Set to next Monday
      const dayOffset = (1 + 7 - futureDate.getDay()) % 7 || 7;
      futureDate.setDate(futureDate.getDate() + dayOffset);
      futureDate.setHours(10, 0, 0, 0);

      // First booking
      await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "First appointment",
        },
        testUser.id
      );

      // Attempt second booking at same time
      await expect(
        appointmentService.createAppointment(
          {
            patientId: testPatient.id,
            providerId: testProvider.id,
            scheduledAt: futureDate,
            duration: 30,
            type: "FOLLOW_UP",
            reason: "Second appointment",
          },
          testUser.id
        )
      ).rejects.toThrow("This time slot conflicts with an existing appointment");
    });

    it("should allow booking after first is cancelled", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      // Set to next Monday
      const dayOffset = (1 + 7 - futureDate.getDay()) % 7 || 7;
      futureDate.setDate(futureDate.getDate() + dayOffset);
      futureDate.setHours(11, 0, 0, 0);

      // First booking
      const first = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "First",
        },
        testUser.id
      );

      // Cancel first
      await appointmentService.cancelAppointment(
        first.id,
        "Cancel",
        testUser.id
      );

      // Second booking should succeed
      const second = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Second",
        },
        testUser.id
      );

      expect(second.status).toBe("REQUESTED");
    });
  });
});
