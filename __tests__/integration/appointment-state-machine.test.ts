/**
 * Integration Tests: Appointment State Machine
 *
 * Tests all valid and invalid state transitions
 * Ensures business rules are enforced
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { appointmentService } from "@/lib/services/appointment.service";
import { InvalidTransitionError } from "@/lib/errors/appointment-errors";

// Helper function to get next Monday
function getNextMonday(daysAhead: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const dayOffset = (1 + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + dayOffset);
  return date;
}

/** A time relative to now, for moving an appointment into the window an action needs. */
function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60000);
}

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

    // Create availability for all days of the week (including weekends for testing)
    const allDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ] as const;
    for (const day of allDays) {
      await prisma.availabilitySlot.create({
        data: {
          providerId: testProvider.id,
          dayOfWeek: day,
          startTime: new Date("1970-01-01T09:00:00Z"),
          endTime: new Date("1970-01-01T17:00:00Z"),
        },
      });
    }
  });

  afterAll(async () => {
    // Cleanup
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.availabilitySlot.deleteMany({});
    await prisma.patient.deleteMany({
      where: { email: "patient-state@test.com" },
    });
    await prisma.provider.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({
      where: { email: "test-state-machine@test.com" },
    });
  });

  beforeEach(async () => {
    // Clean up appointments between tests to prevent conflicts
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
  });

  describe("Valid Transitions", () => {
    it("should allow: REQUESTED → CONFIRMED", async () => {
      const futureDate = getNextMonday();
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
      const futureDate = getNextMonday();
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
      // Check-in opens an hour before the visit: the visit is now 10 minutes away.
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { scheduledAt: minutesFromNow(10) },
      });

      const checkedIn = await appointmentService.checkInAppointment(
        appointment.id,
        testUser.id
      );

      expect(checkedIn.status).toBe("CHECKED_IN");
      expect(checkedIn.checkedInAt).toBeDefined();

      // Cleanup
      await prisma.appointmentHistory.deleteMany({
        where: { appointmentId: appointment.id },
      });
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should allow: CHECKED_IN → COMPLETED", async () => {
      const futureDate = getNextMonday();
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
      // The visit started 5 minutes ago, so it can be checked in and completed.
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { scheduledAt: minutesFromNow(-5) },
      });
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
      const futureDate = getNextMonday();
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
      const futureDate = getNextMonday();
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
      const futureDate = getNextMonday();
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
      const futureDate = getNextMonday();
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
      const futureDate = getNextMonday();
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
      const futureDate = getNextMonday();
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
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { scheduledAt: minutesFromNow(10) },
      });
      await appointmentService.checkInAppointment(appointment.id, testUser.id);

      await expect(
        appointmentService.cancelAppointment(
          appointment.id,
          "Too late",
          testUser.id
        )
      ).rejects.toThrow(
        "Cannot cancel appointment after patient has been checked in"
      );

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });

    it("should reject: NO_SHOW before scheduled time", async () => {
      const futureDate = getNextMonday();
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
      ).rejects.toThrow(
        "Cannot mark appointment as NO_SHOW before the scheduled time"
      );

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });
  });

  describe("Timing Rules", () => {
    const insert = (
      status: "REQUESTED" | "CONFIRMED" | "CHECKED_IN",
      scheduledAt: Date
    ) =>
      prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt,
          duration: 30,
          type: "FOLLOW_UP",
          status,
          reason: "Checkup",
        },
      });

    it("should reject confirming an appointment whose start time has passed", async () => {
      const appointment = await insert("REQUESTED", minutesFromNow(-60));
      await expect(
        appointmentService.confirmAppointment(appointment.id, testUser.id)
      ).rejects.toThrow("can't be confirmed");
    });

    it("should reject check-in more than an hour before the visit", async () => {
      const appointment = await insert("CONFIRMED", minutesFromNow(90));
      await expect(
        appointmentService.checkInAppointment(appointment.id, testUser.id)
      ).rejects.toThrow("Check-in opens");
    });

    it("should reject check-in after the visit has ended", async () => {
      const appointment = await insert("CONFIRMED", minutesFromNow(-45));
      await expect(
        appointmentService.checkInAppointment(appointment.id, testUser.id)
      ).rejects.toThrow("already ended");
    });

    it("should reject completing a visit before its start time", async () => {
      const appointment = await insert("CHECKED_IN", minutesFromNow(30));
      await expect(
        appointmentService.completeAppointment(appointment.id, testUser.id)
      ).rejects.toThrow("before its scheduled start time");
    });

    it("should reject cancelling a confirmed appointment after its start time", async () => {
      const appointment = await insert("CONFIRMED", minutesFromNow(-10));
      await expect(
        appointmentService.cancelAppointment(
          appointment.id,
          "Too late",
          testUser.id
        )
      ).rejects.toThrow("can't be cancelled after its start time");
    });

    it("should still allow cancelling an unconfirmed request after its start time", async () => {
      const appointment = await insert("REQUESTED", minutesFromNow(-10));
      const cancelled = await appointmentService.cancelAppointment(
        appointment.id,
        "Request expired",
        testUser.id
      );
      expect(cancelled.status).toBe("CANCELLED");
    });

    it("should reject rescheduling after the patient has checked in", async () => {
      const appointment = await insert("CHECKED_IN", minutesFromNow(-5));
      await expect(
        appointmentService.rescheduleAppointment(
          appointment.id,
          minutesFromNow(24 * 60),
          undefined,
          testUser.id
        )
      ).rejects.toThrow("can't be rescheduled");
    });
  });
});
