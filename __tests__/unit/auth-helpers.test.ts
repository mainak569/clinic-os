/**
 * Unit Tests: Authorization Helpers
 * 
 * Tests for lib/auth-helpers.ts
 * Critical security component - comprehensive testing required
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// Mock the auth module
const mockAuth = jest.fn();
jest.mock("@/auth", () => ({
  auth: mockAuth,
}));

// Mock Prisma
const mockPrismaFindFirst = jest.fn();
jest.mock("@/prisma.config", () => ({
  prisma: {
    appointment: {
      findFirst: mockPrismaFindFirst,
    },
  },
}));

import {
  canAccessProviderData,
  canAccessAppointment,
  canAccessPatient,
  isFrontDesk,
  isProvider,
  getCurrentProviderId,
} from "@/lib/auth-helpers";

describe("Authorization Helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("canAccessProviderData", () => {
    it("should allow FRONT_DESK to access any provider", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user1", role: "FRONT_DESK", providerId: null },
      });

      const result = await canAccessProviderData("provider123");
      expect(result).toBe(true);
    });

    it("should allow PROVIDER to access own data", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user1", role: "PROVIDER", providerId: "provider123" },
      });

      const result = await canAccessProviderData("provider123");
      expect(result).toBe(true);
    });

    it("should deny PROVIDER accessing other provider data", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user1", role: "PROVIDER", providerId: "provider123" },
      });

      const result = await canAccessProviderData("provider456");
      expect(result).toBe(false);
    });

    it("should deny access if no provider ID", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user1", role: "PROVIDER", providerId: null },
      });

      const result = await canAccessProviderData("provider123");
      expect(result).toBe(false);
    });
  });

  describe("canAccessAppointment", () => {
    it("should use same logic as canAccessProviderData", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user1", role: "FRONT_DESK", providerId: null },
      });

      const result = await canAccessAppointment("provider123");
      expect(result).toBe(true);
    });
  });

  describe("canAccessPatient", () => {
    it("should allow FRONT_DESK to access any patient", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user1", role: "FRONT_DESK", providerId: null },
      });

      const result = await canAccessPatient("patient123");
      expect(result).toBe(true);
    });

    it("should allow PROVIDER to access patient with appointment", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user1", role: "PROVIDER", providerId: "provider123" },
      });

      mockPrismaFindFirst.mockResolvedValue({
        id: "appt1",
        patientId: "patient123",
        providerId: "provider123",
      });

      const result = await canAccessPatient("patient123");
      expect(result).toBe(true);
      expect(mockPrismaFindFirst).toHaveBeenCalledWith({
        where: {
          patientId: "patient123",
          providerId: "provider123",
        },
      });
    });

    it("should deny PROVIDER accessing patient without appointment", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user1", role: "PROVIDER", providerId: "provider123" },
      });

      mockPrismaFindFirst.mockResolvedValue(null);

      const result = await canAccessPatient("patient456");
      expect(result).toBe(false);
    });
  });

  describe("Role Checkers", () => {
    it("isFrontDesk should return true for FRONT_DESK", async () => {
      mockAuth.mockResolvedValue({
        user: { role: "FRONT_DESK" },
      });

      const result = await isFrontDesk();
      expect(result).toBe(true);
    });

    it("isFrontDesk should return false for PROVIDER", async () => {
      mockAuth.mockResolvedValue({
        user: { role: "PROVIDER" },
      });

      const result = await isFrontDesk();
      expect(result).toBe(false);
    });

    it("isProvider should return true for PROVIDER", async () => {
      mockAuth.mockResolvedValue({
        user: { role: "PROVIDER" },
      });

      const result = await isProvider();
      expect(result).toBe(true);
    });

    it("getCurrentProviderId should return provider ID", async () => {
      mockAuth.mockResolvedValue({
        user: { providerId: "provider123" },
      });

      const result = await getCurrentProviderId();
      expect(result).toBe("provider123");
    });

    it("getCurrentProviderId should return null for FRONT_DESK", async () => {
      mockAuth.mockResolvedValue({
        user: { providerId: null },
      });

      const result = await getCurrentProviderId();
      expect(result).toBeNull();
    });
  });
});
