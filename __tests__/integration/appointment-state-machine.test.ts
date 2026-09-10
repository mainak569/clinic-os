/**
 * Integration Tests: Appointment State Machine
 * 
 * Tests all valid and invalid state transitions
 * Ensures business rules are enforced
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { appointmentService } from "@/lib/services/appointment.service";
import { InvalidTransitionError } from "@/lib/errors/appointment-errors";
import { AppointmentStatus } from "@prisma/client";

describe("Appointment State Machine", () => {
  let testPatient: any;
  let testProvider: any;
  let testUser: any;

  beforeAll(async () => {
    // Create test data
    testUser = await prisma.user.create({
      data: {
        email: "test-state-machine@test.com",
        passwordHash: "hash",
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
        email: "patient-state@test.com",
      },
    });

    // Create availability for provider
    await prisma.availabilitySlot.create({
      data: {
        providerId: testProvider.id,
        dayOfWeek: "MONDAY",
        startTime: new Date("2024-01-01T09:00:00"),
        endTime: new Date("2024-01-01T17:00:00"),
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.availabilitySlot.deleteMany({});
    await prisma.patient.deleteMany({ where: { email: "patient-state@test.com" } });
    await prisma.provider.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { email: "test-state-machine@test.com" } });
  });

  describe("Valid Transitions", () => {
    it("should allow: REQUESTED → CONFIRMED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      expect(appointment.status).toBe("REQUESTED");

      const confirmed = await appointmentService.confirmAppointment(
        appointment.id,
        testUser.id
      );

      expect(confirmed.status).toBe("CONFIRMED");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should allow: CONFIRMED → CHECKED_IN", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      await appointmentService.confirmAppointment(appointment.id, testUser.id);

      const checkedIn = await appointmentService.checkInAppointment(
        appointment.id,
        testUser.id
      );

      expect(checkedIn.status).toBe("CHECKED_IN");
      expect(checkedIn.checkedInAt).toBeDefined();

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should allow: CHECKED_IN → COMPLETED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      await appointmentService.confirmAppointment(appointment.id, testUser.id);
      await appointmentService.checkInAppointment(appointment.id, testUser.id);

      const completed = await appointmentService.completeAppointment(
        appointment.id,
        testUser.id
      );

      expect(completed.status).toBe("COMPLETED");
      expect(completed.checkedOutAt).toBeDefined();

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should allow: CONFIRMED → NO_SHOW (after scheduled time)", async () => {
      // Create appointment in the past
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);
      pastDate.setMinutes(0, 0, 0);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: pastDate,
          duration: 30,
          type: "FOLLOW_UP",
          status: "CONFIRMED",
          reason: "Checkup",
        },
      });

      const noShow = await appointmentService.markNoShow(
        appointment.id,
        "Patient did not show up",
        testUser.id
      );

      expect(noShow.status).toBe("NO_SHOW");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should allow: REQUESTED → CANCELLED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      const cancelled = await appointmentService.cancelAppointment(
        appointment.id,
        "Patient requested cancellation",
        testUser.id
      );

      expect(cancelled.status).toBe("CANCELLED");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should allow: CONFIRMED → CANCELLED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      await appointmentService.confirmAppointment(appointment.id, testUser.id);

      const cancelled = await appointmentService.cancelAppointment(
        appointment.id,
        "Emergency cancellation",
        testUser.id
      );

      expect(cancelled.status).toBe("CANCELLED");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });
  });

  describe("Invalid Transitions", () => {
    it("should reject: REQUESTED → CHECKED_IN", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      await expect(
        appointmentService.checkInAppointment(appointment.id, testUser.id)
      ).rejects.toThrow(InvalidTransitionError);

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should reject: REQUESTED → COMPLETED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      await expect(
        appointmentService.completeAppointment(appointment.id, testUser.id)
      ).rejects.toThrow(InvalidTransitionError);

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should reject: COMPLETED → CONFIRMED", async () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: pastDate,
          duration: 30,
          type: "FOLLOW_UP",
          status: "COMPLETED",
          reason: "Checkup",
          checkedInAt: pastDate,
          checkedOutAt: new Date(),
        },
      });

      await expect(
        appointmentService.confirmAppointment(appointment.id, testUser.id)
      ).rejects.toThrow(InvalidTransitionError);

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should reject: CANCELLED → CONFIRMED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          status: "CANCELLED",
          reason: "Checkup",
        },
      });

      await expect(
        appointmentService.confirmAppointment(appointment.id, testUser.id)
      ).rejects.toThrow(InvalidTransitionError);

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should reject: CHECKED_IN → CANCELLED", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      await appointmentService.confirmAppointment(appointment.id, testUser.id);
      await appointmentService.checkInAppointment(appointment.id, testUser.id);

      await expect(
        appointmentService.cancelAppointment(
          appointment.id,
          "Too late",
          testUser.id
        )
      ).rejects.toThrow("Cannot cancel appointment after patient has been checked in");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should reject: NO_SHOW before scheduled time", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const appointment = await appointmentService.createAppointment(
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

      await appointmentService.confirmAppointment(appointment.id, testUser.id);

      await expect(
        appointmentService.markNoShow(appointment.id, undefined, testUser.id)
      ).rejects.toThrow("Cannot mark appointment as NO_SHOW before the scheduled time");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });
  });
});
