/**
 * Unit Tests: Validation Schemas
 * 
 * Tests for Zod validation schemas
 */

import { describe, it, expect } from "@jest/globals";
import {
  createAppointmentSchema,
  confirmAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "@/lib/validations/appointment";

describe("Validation Schemas", () => {
  describe("createAppointmentSchema", () => {
    it("should accept valid appointment data", () => {
      const validData = {
        patientId: "patient_123",
        providerId: "provider_456",
        scheduledAt: new Date("2026-12-01T10:00:00"),
        duration: 30,
        type: "FOLLOW_UP",
        reason: "Regular checkup",
      };

      const result = createAppointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const invalidData = {
        patientId: "patient_123",
        // Missing other required fields
      };

      const result = createAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject invalid appointment type", () => {
      const invalidData = {
        patientId: "patient_123",
        providerId: "provider_456",
        scheduledAt: new Date(),
        duration: 30,
        type: "INVALID_TYPE", // Not a valid AppointmentType
        reason: "Checkup",
      };

      const result = createAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject negative duration", () => {
      const invalidData = {
        patientId: "patient_123",
        providerId: "provider_456",
        scheduledAt: new Date(),
        duration: -10, // Invalid
        type: "FOLLOW_UP",
        reason: "Checkup",
      };

      const result = createAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should accept optional notes field", () => {
      const validData = {
        patientId: "patient_123",
        providerId: "provider_456",
        scheduledAt: new Date(),
        duration: 30,
        type: "FOLLOW_UP",
        reason: "Checkup",
        notes: "Patient prefers morning appointments",
      };

      const result = createAppointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe("confirmAppointmentSchema", () => {
    it("should accept valid appointment ID", () => {
      const result = confirmAppointmentSchema.safeParse({
        appointmentId: "appt_123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing appointment ID", () => {
      const result = confirmAppointmentSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("cancelAppointmentSchema", () => {
    it("should require cancellation reason", () => {
      const validData = {
        appointmentId: "appt_123",
        cancellationReason: "Patient requested cancellation",
      };

      const result = cancelAppointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject empty cancellation reason", () => {
      const invalidData = {
        appointmentId: "appt_123",
        cancellationReason: "", // Empty string
      };

      const result = cancelAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("should reject missing cancellation reason", () => {
      const invalidData = {
        appointmentId: "appt_123",
        // Missing cancellationReason
      };

      const result = cancelAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("rescheduleAppointmentSchema", () => {
    it("should accept valid reschedule data", () => {
      const validData = {
        appointmentId: "appt_123",
        newScheduledAt: new Date("2026-12-02T10:00:00"),
        reason: "Patient requested different time",
      };

      const result = rescheduleAppointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should accept reschedule without reason", () => {
      const validData = {
        appointmentId: "appt_123",
        newScheduledAt: new Date("2026-12-02T10:00:00"),
      };

      const result = rescheduleAppointmentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid date", () => {
      const invalidData = {
        appointmentId: "appt_123",
        newScheduledAt: "not a date", // Invalid
      };

      const result = rescheduleAppointmentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
