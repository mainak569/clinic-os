/**
 * Unit Tests: Appointment Service
 * 
 * Tests for lib/services/appointment.service.ts
 * Critical business logic - state machine transitions
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  InvalidTransitionError,
  AppointmentNotFoundError,
} from "@/lib/errors/appointment-errors";

// Mock Prisma
const mockPrismaAppointmentFindUnique = jest.fn();
const mockPrismaAppointmentCreate = jest.fn();
const mockPrismaAppointmentUpdate = jest.fn();
const mockPrismaAppointmentFindMany = jest.fn();
const mockPrismaAppointmentHistoryCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      findUnique: mockPrismaAppointmentFindUnique,
      create: mockPrismaAppointmentCreate,
      update: mockPrismaAppointmentUpdate,
      findMany: mockPrismaAppointmentFindMany,
    },
    appointmentHistory: {
      create: mockPrismaAppointmentHistoryCreate,
    },
  },
}));

// Mock availability service
const mockIsProviderAvailable = jest.fn();
jest.mock("@/lib/services/availability.service", () => ({
  availabilityService: {
    isProviderAvailable: mockIsProviderAvailable,
  },
}));

import { appointmentService } from "@/lib/services/appointment.service";

describe("Appointment Service - State Machine", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("confirmAppointment", () => {
    it("should allow REQUESTED → CONFIRMED transition", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "REQUESTED",
      });

      mockPrismaAppointmentUpdate.mockResolvedValue({
        id: "appt1",
        status: "CONFIRMED",
      });

      const result = await appointmentService.confirmAppointment(
        "appt1",
        "user1"
      );

      expect(result.status).toBe("CONFIRMED");
      expect(mockPrismaAppointmentUpdate).toHaveBeenCalledWith({
        where: { id: "appt1" },
        data: { status: "CONFIRMED" },
        include: expect.any(Object),
      });
    });

    it("should reject invalid transition from COMPLETED", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "COMPLETED",
      });

      await expect(
        appointmentService.confirmAppointment("appt1", "user1")
      ).rejects.toThrow(InvalidTransitionError);
    });

    it("should reject transition from CANCELLED", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "CANCELLED",
      });

      await expect(
        appointmentService.confirmAppointment("appt1", "user1")
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe("checkInAppointment", () => {
    it("should allow CONFIRMED → CHECKED_IN transition", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "CONFIRMED",
      });

      mockPrismaAppointmentUpdate.mockResolvedValue({
        id: "appt1",
        status: "CHECKED_IN",
        checkedInAt: new Date(),
      });

      const result = await appointmentService.checkInAppointment(
        "appt1",
        "user1"
      );

      expect(result.status).toBe("CHECKED_IN");
    });

    it("should reject check-in from REQUESTED", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "REQUESTED",
      });

      await expect(
        appointmentService.checkInAppointment("appt1", "user1")
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe("completeAppointment", () => {
    it("should allow CHECKED_IN → COMPLETED transition", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "CHECKED_IN",
      });

      mockPrismaAppointmentUpdate.mockResolvedValue({
        id: "appt1",
        status: "COMPLETED",
        checkedOutAt: new Date(),
      });

      const result = await appointmentService.completeAppointment(
        "appt1",
        "user1"
      );

      expect(result.status).toBe("COMPLETED");
    });

    it("should reject completion from CONFIRMED", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "CONFIRMED",
      });

      await expect(
        appointmentService.completeAppointment("appt1", "user1")
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe("markNoShow", () => {
    it("should allow NO_SHOW from CONFIRMED after scheduled time", async () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago

      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "CONFIRMED",
        scheduledAt: pastDate,
      });

      mockPrismaAppointmentUpdate.mockResolvedValue({
        id: "appt1",
        status: "NO_SHOW",
      });

      const result = await appointmentService.markNoShow(
        "appt1",
        "Patient did not show",
        "user1"
      );

      expect(result.status).toBe("NO_SHOW");
    });

    it("should reject NO_SHOW before scheduled time", async () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now

      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "CONFIRMED",
        scheduledAt: futureDate,
      });

      await expect(
        appointmentService.markNoShow("appt1", "Note", "user1")
      ).rejects.toThrow("Cannot mark appointment as NO_SHOW before the scheduled time");
    });

    it("should reject NO_SHOW from REQUESTED", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "REQUESTED",
        scheduledAt: new Date(Date.now() - 3600000),
      });

      await expect(
        appointmentService.markNoShow("appt1", "Note", "user1")
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe("cancelAppointment", () => {
    it("should allow cancellation from REQUESTED", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "REQUESTED",
        notes: null,
      });

      mockPrismaAppointmentUpdate.mockResolvedValue({
        id: "appt1",
        status: "CANCELLED",
      });

      const result = await appointmentService.cancelAppointment(
        "appt1",
        "Patient request",
        "user1"
      );

      expect(result.status).toBe("CANCELLED");
    });

    it("should allow cancellation from CONFIRMED", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "CONFIRMED",
        notes: null,
      });

      mockPrismaAppointmentUpdate.mockResolvedValue({
        id: "appt1",
        status: "CANCELLED",
      });

      const result = await appointmentService.cancelAppointment(
        "appt1",
        "Scheduling conflict",
        "user1"
      );

      expect(result.status).toBe("CANCELLED");
    });

    it("should reject cancellation after CHECKED_IN", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "CHECKED_IN",
      });

      await expect(
        appointmentService.cancelAppointment("appt1", "Reason", "user1")
      ).rejects.toThrow("Cannot cancel appointment after patient has been checked in");
    });

    it("should reject cancellation from COMPLETED", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue({
        id: "appt1",
        status: "COMPLETED",
      });

      await expect(
        appointmentService.cancelAppointment("appt1", "Reason", "user1")
      ).rejects.toThrow(InvalidTransitionError);
    });
  });

  describe("createAppointment", () => {
    it("should check provider availability", async () => {
      mockIsProviderAvailable.mockResolvedValue(true);
      mockPrismaAppointmentFindMany.mockResolvedValue([]);
      mockPrismaAppointmentCreate.mockResolvedValue({
        id: "appt1",
        status: "REQUESTED",
      });

      await appointmentService.createAppointment(
        {
          patientId: "patient1",
          providerId: "provider1",
          scheduledAt: new Date(),
          duration: 30,
          type: "FOLLOW_UP",
          reason: "Checkup",
        },
        "user1"
      );

      expect(mockIsProviderAvailable).toHaveBeenCalled();
    });

    it("should reject if provider not available", async () => {
      mockIsProviderAvailable.mockResolvedValue(false);

      await expect(
        appointmentService.createAppointment(
          {
            patientId: "patient1",
            providerId: "provider1",
            scheduledAt: new Date(),
            duration: 30,
            type: "FOLLOW_UP",
            reason: "Checkup",
          },
          "user1"
        )
      ).rejects.toThrow("Provider is not available at the requested time");
    });

    it("should reject if scheduling conflict exists", async () => {
      mockIsProviderAvailable.mockResolvedValue(true);
      mockPrismaAppointmentFindMany.mockResolvedValue([
        { id: "existing", status: "CONFIRMED" },
      ]);

      await expect(
        appointmentService.createAppointment(
          {
            patientId: "patient1",
            providerId: "provider1",
            scheduledAt: new Date(),
            duration: 30,
            type: "FOLLOW_UP",
            reason: "Checkup",
          },
          "user1"
        )
      ).rejects.toThrow("This time slot conflicts with an existing appointment");
    });
  });

  describe("Error Handling", () => {
    it("should throw AppointmentNotFoundError for invalid ID", async () => {
      mockPrismaAppointmentFindUnique.mockResolvedValue(null);

      await expect(
        appointmentService.confirmAppointment("invalid", "user1")
      ).rejects.toThrow(AppointmentNotFoundError);
    });
  });
});
