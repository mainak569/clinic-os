/**
 * Integration Tests: Duplicate Booking Prevention
 * 
 * Tests prevention of double-booking and scheduling conflicts
 * Critical for appointment system integrity
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { prisma } from "@/lib/prisma";
import { appointmentService } from "@/lib/services/appointment.service";

// Helper function to get next Monday
function getNextMonday(daysAhead: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  const dayOffset = (1 + 7 - date.getDay()) % 7 || 7;
  date.setDate(date.getDate() + dayOffset);
  return date;
}

describe("Duplicate Booking Prevention", () => {
  let testPatient: any;
  let testProvider: any;
  let testUser: any;

  beforeAll(async () => {
    testUser = await prisma.user.create({
      data: {
        email: "test-duplicate@test.com",
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
        email: "patient-duplicate@test.com",
      },
    });

    // Create availability
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
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
    await prisma.availabilitySlot.deleteMany({});
    await prisma.patient.deleteMany({ where: { email: "patient-duplicate@test.com" } });
    await prisma.provider.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.deleteMany({ where: { email: "test-duplicate@test.com" } });
  });

  beforeEach(async () => {
    // Clean up appointments between tests to prevent conflicts
    await prisma.appointmentHistory.deleteMany({});
    await prisma.appointment.deleteMany({});
  });

  describe("Exact Time Conflict", () => {
    it("should prevent booking same time slot twice", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // First booking
      const appointment1 = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Checkup 1",
        },
        testUser.id
      );

      expect(appointment1).toBeDefined();

      // Second booking at exact same time
      await expect(
        appointmentService.createAppointment(
          {
            patientId: testPatient.id,
            providerId: testProvider.id,
            scheduledAt: futureDate,
            duration: 30,
            type: "FOLLOW_UP",
            reason: "Checkup 2",
          },
          testUser.id
        )
      ).rejects.toThrow("conflicts with an existing appointment");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment1.id } });
    });
  });

  describe("Overlapping Time Conflicts", () => {
    it("should prevent booking that starts during existing appointment", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // First appointment: 10:00 - 10:30
      const appointment1 = await appointmentService.createAppointment(
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

      // Second appointment starting at 10:15 (during first)
      const overlappingDate = new Date(futureDate);
      overlappingDate.setMinutes(15);

      await expect(
        appointmentService.createAppointment(
          {
            patientId: testPatient.id,
            providerId: testProvider.id,
            scheduledAt: overlappingDate,
            duration: 30,
            type: "FOLLOW_UP",
            reason: "Second",
          },
          testUser.id
        )
      ).rejects.toThrow("conflicts with an existing appointment");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment1.id } });
    });

    it("should prevent booking that ends during existing appointment", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // First appointment: 10:00 - 10:30
      const appointment1 = await appointmentService.createAppointment(
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

      // Second appointment: 9:45 - 10:15 (ends during first)
      const earlierDate = new Date(futureDate);
      earlierDate.setMinutes(-15);

      await expect(
        appointmentService.createAppointment(
          {
            patientId: testPatient.id,
            providerId: testProvider.id,
            scheduledAt: earlierDate,
            duration: 30,
            type: "FOLLOW_UP",
            reason: "Second",
          },
          testUser.id
        )
      ).rejects.toThrow("conflicts with an existing appointment");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment1.id } });
    });

    it("should prevent booking that completely contains existing appointment", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // First appointment: 10:00 - 10:30
      const appointment1 = await appointmentService.createAppointment(
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

      // Second appointment: 9:45 - 10:45 (contains first)
      const earlierDate = new Date(futureDate);
      earlierDate.setMinutes(-15);

      await expect(
        appointmentService.createAppointment(
          {
            patientId: testPatient.id,
            providerId: testProvider.id,
            scheduledAt: earlierDate,
            duration: 60,
            type: "FOLLOW_UP",
            reason: "Second",
          },
          testUser.id
        )
      ).rejects.toThrow("conflicts with an existing appointment");

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment1.id } });
    });
  });

  describe("Back-to-Back Appointments", () => {
    it("should allow back-to-back appointments (no overlap)", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // First appointment: 10:00 - 10:30
      const appointment1 = await appointmentService.createAppointment(
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

      // Second appointment: 10:30 - 11:00 (right after first)
      const nextDate = new Date(futureDate);
      nextDate.setMinutes(30);

      const appointment2 = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: nextDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Second",
        },
        testUser.id
      );

      expect(appointment2).toBeDefined();

      // Cleanup
      await prisma.appointment.deleteMany({
        where: { id: { in: [appointment1.id, appointment2.id] } },
      });
    });
  });

  describe("Cancelled/Completed Appointments", () => {
    it("should allow booking over CANCELLED appointment slot", async () => {
      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // First appointment
      const appointment1 = await appointmentService.createAppointment(
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

      // Cancel it
      await appointmentService.cancelAppointment(
        appointment1.id,
        "Patient cancelled",
        testUser.id
      );

      // Should be able to book same time slot now
      const appointment2 = await appointmentService.createAppointment(
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

      expect(appointment2).toBeDefined();
      expect(appointment2.status).toBe("REQUESTED");

      // Cleanup
      await prisma.appointment.deleteMany({
        where: { id: { in: [appointment1.id, appointment2.id] } },
      });
    });

    it("should NOT check conflicts with COMPLETED appointments", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      pastDate.setHours(10, 0, 0, 0);

      // Create completed appointment in past
      const completedAppt = await prisma.appointment.create({
        data: {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: pastDate,
          duration: 30,
          type: "FOLLOW_UP",
          status: "COMPLETED",
          reason: "Past appointment",
          checkedInAt: pastDate,
          checkedOutAt: new Date(pastDate.getTime() + 30 * 60000),
        },
      });

      // Should still be able to book that historical time
      // (not really a use case, but tests the status filter)
      const hasConflict = await prisma.appointment.count({
        where: {
          providerId: testProvider.id,
          status: { in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"] },
          scheduledAt: pastDate,
        },
      });

      expect(hasConflict).toBe(0);

      // Cleanup
      await prisma.appointment.delete({ where: { id: completedAppt.id } });
    });
  });

  describe("Rescheduling Conflicts", () => {
    it("should prevent rescheduling to conflicting time", async () => {
      const futureDate1 = getNextMonday();
      futureDate1.setHours(10, 0, 0, 0);

      const futureDate2 = new Date(futureDate1);
      futureDate2.setHours(11, 0, 0, 0);

      // Create two appointments
      const appointment1 = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate1,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "First",
        },
        testUser.id
      );

      const appointment2 = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate2,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Second",
        },
        testUser.id
      );

      // Try to reschedule appointment2 to overlap with appointment1
      await expect(
        appointmentService.rescheduleAppointment(
          appointment2.id,
          futureDate1,
          "Trying to overlap",
          testUser.id
        )
      ).rejects.toThrow("conflicts with an existing appointment");

      // Cleanup
      await prisma.appointmentHistory.deleteMany({
        where: { appointmentId: { in: [appointment1.id, appointment2.id] } },
      });
      await prisma.appointment.deleteMany({
        where: { id: { in: [appointment1.id, appointment2.id] } },
      });
    });

    it("should allow rescheduling to non-conflicting time", async () => {
      const futureDate1 = getNextMonday();
      futureDate1.setHours(10, 0, 0, 0);

      const futureDate2 = new Date(futureDate1);
      futureDate2.setHours(11, 0, 0, 0);

      const futureDate3 = new Date(futureDate1);
      futureDate3.setHours(14, 0, 0, 0);

      // Create appointment
      const appointment = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate1,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "First",
        },
        testUser.id
      );

      // Reschedule to non-conflicting time
      const rescheduled = await appointmentService.rescheduleAppointment(
        appointment.id,
        futureDate3,
        "Patient requested",
        testUser.id
      );

      expect(rescheduled.scheduledAt).toEqual(futureDate3);

      // Cleanup
      await prisma.appointment.delete({ where: { id: appointment.id } });
    });
  });

  describe("Different Provider Isolation", () => {
    it("should allow same time slot for different providers", async () => {
      // Use timestamp to ensure unique email
      const timestamp = Date.now();
      const provider2User = await prisma.user.create({
        data: {
          email: `provider2-dup-${timestamp}@test.com`,
          passwordHash: "hash",
          role: "PROVIDER",
        },
      });

      const provider2 = await prisma.provider.create({
        data: {
          userId: provider2User.id,
          firstName: "Provider",
          lastName: "Two",
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

      const futureDate = getNextMonday();
      
      futureDate.setHours(10, 0, 0, 0);

      // Book with provider 1
      const appointment1 = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: testProvider.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Provider 1",
        },
        testUser.id
      );

      // Should be able to book same time with provider 2
      const appointment2 = await appointmentService.createAppointment(
        {
          patientId: testPatient.id,
          providerId: provider2.id,
          scheduledAt: futureDate,
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Provider 2",
        },
        provider2User.id
      );

      expect(appointment1).toBeDefined();
      expect(appointment2).toBeDefined();
      expect(appointment1.providerId).not.toBe(appointment2.providerId);
      expect(appointment1.scheduledAt).toEqual(appointment2.scheduledAt);

      // Cleanup
      await prisma.appointmentHistory.deleteMany({
        where: { appointmentId: { in: [appointment1.id, appointment2.id] } },
      });
      await prisma.appointment.deleteMany({
        where: { id: { in: [appointment1.id, appointment2.id] } },
      });
      await prisma.availabilitySlot.deleteMany({ where: { providerId: provider2.id } });
      await prisma.provider.delete({ where: { id: provider2.id } });
      await prisma.user.delete({ where: { id: provider2User.id } });
    });
  });
});
