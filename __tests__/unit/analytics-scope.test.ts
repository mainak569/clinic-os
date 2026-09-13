/**
 * Unit Tests: Analytics provider isolation
 *
 * Regression for a leak where a provider's dashboard showed the whole clinic's
 * status breakdown and no-show trend, and the standalone analytics actions
 * returned clinic-wide data to any signed-in user. These tests assert the
 * database queries themselves carry the provider filter.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

const mockGroupBy = jest.fn() as jest.MockedFunction<any>;
const mockFindMany = jest.fn() as jest.MockedFunction<any>;
const mockCount = jest.fn() as jest.MockedFunction<any>;
const mockProviderFindMany = jest.fn() as jest.MockedFunction<any>;

jest.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      groupBy: mockGroupBy,
      findMany: mockFindMany,
      count: mockCount,
    },
    provider: {
      findMany: mockProviderFindMany,
    },
  },
}));

const mockRequireAuth = jest.fn() as jest.MockedFunction<any>;
jest.mock("@/lib/auth-helpers", () => ({
  requireAuth: mockRequireAuth,
}));

import { analyticsService } from "@/lib/services/analytics.service";
import {
  getAppointmentsByProvider,
  getAppointmentsByStatus,
  getDashboardAnalytics,
  getNoShowRateLast8Weeks,
  getRecentTrends,
} from "@/app/actions/analytics.actions";

const asProvider = (providerId: string | null = "provider-a") =>
  mockRequireAuth.mockResolvedValue({
    user: { id: "user-a", role: "PROVIDER", providerId },
  });
const asFrontDesk = () =>
  mockRequireAuth.mockResolvedValue({
    user: { id: "user-fd", role: "FRONT_DESK", providerId: null },
  });

/** The `where` of every call to a mocked query. */
const wheres = (fn: jest.MockedFunction<any>) =>
  fn.mock.calls.map((call: any[]) => call[0]?.where ?? {});
const statusGroupByWheres = () =>
  mockGroupBy.mock.calls
    .map((call: any[]) => call[0])
    .filter((args: any) => args.by?.[0] === "status")
    .map((args: any) => args.where ?? {});

describe("Analytics provider isolation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGroupBy.mockResolvedValue([]);
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);
    mockProviderFindMany.mockResolvedValue([]);
  });

  describe("AnalyticsService.getProviderAnalytics", () => {
    it("scopes the status chart, no-show trend and summary counts to the provider", async () => {
      await analyticsService.getProviderAnalytics("provider-a");

      const statusWheres = statusGroupByWheres();
      expect(statusWheres).toHaveLength(1);
      expect(statusWheres[0].providerId).toBe("provider-a");

      expect(wheres(mockFindMany)).toHaveLength(1);
      expect(wheres(mockFindMany)[0].providerId).toBe("provider-a");

      expect(mockCount).toHaveBeenCalled();
      for (const where of wheres(mockCount)) {
        expect(where.providerId).toBe("provider-a");
      }
    });

    it("never runs the cross-provider aggregation", async () => {
      await analyticsService.getProviderAnalytics("provider-a");

      const byProvider = mockGroupBy.mock.calls.filter(
        (call: any[]) => call[0]?.by?.[0] === "providerId"
      );
      expect(byProvider).toHaveLength(0);
    });
  });

  describe("AnalyticsService clinic-wide view", () => {
    it("leaves getDashboardAnalytics unscoped for front desk", async () => {
      await analyticsService.getDashboardAnalytics();

      expect(statusGroupByWheres()[0].providerId).toBeUndefined();
      expect(wheres(mockFindMany)[0].providerId).toBeUndefined();
    });
  });

  describe("getDashboardAnalytics action", () => {
    it("gives a provider only their own data", async () => {
      asProvider("provider-a");

      const result = await getDashboardAnalytics();

      expect(result.success).toBe(true);
      expect(statusGroupByWheres()[0].providerId).toBe("provider-a");
      expect(wheres(mockFindMany)[0].providerId).toBe("provider-a");
    });

    it("gives front desk the whole clinic", async () => {
      asFrontDesk();

      const result = await getDashboardAnalytics();

      expect(result.success).toBe(true);
      expect(statusGroupByWheres()[0].providerId).toBeUndefined();
    });

    it("refuses a provider account with no linked provider", async () => {
      asProvider(null);

      const result = await getDashboardAnalytics();

      expect(result).toEqual({ success: false, error: "Provider ID not found" });
      expect(mockGroupBy).not.toHaveBeenCalled();
      expect(mockFindMany).not.toHaveBeenCalled();
      expect(mockCount).not.toHaveBeenCalled();
    });
  });

  describe("standalone analytics actions", () => {
    it("getAppointmentsByStatus is scoped for a provider", async () => {
      asProvider("provider-a");

      const result = await getAppointmentsByStatus();

      expect(result.success).toBe(true);
      expect(statusGroupByWheres()).toEqual([{ providerId: "provider-a" }]);
    });

    it("getAppointmentsByStatus is clinic-wide for front desk", async () => {
      asFrontDesk();

      await getAppointmentsByStatus();

      expect(statusGroupByWheres()[0].providerId).toBeUndefined();
    });

    it("getNoShowRateLast8Weeks is scoped for a provider", async () => {
      asProvider("provider-a");

      const result = await getNoShowRateLast8Weeks();

      expect(result.success).toBe(true);
      expect(wheres(mockFindMany)[0].providerId).toBe("provider-a");
    });

    it("getRecentTrends is scoped for a provider on every count", async () => {
      asProvider("provider-a");

      const result = await getRecentTrends(30);

      expect(result.success).toBe(true);
      expect(mockCount).toHaveBeenCalledTimes(5);
      for (const where of wheres(mockCount)) {
        expect(where.providerId).toBe("provider-a");
      }
    });

    it("refuses provider accounts with no linked provider instead of returning clinic data", async () => {
      asProvider(null);

      for (const action of [getAppointmentsByStatus, getNoShowRateLast8Weeks, () => getRecentTrends()]) {
        const result = await action();
        expect(result).toEqual({ success: false, error: "Provider ID not found" });
      }
      expect(mockGroupBy).not.toHaveBeenCalled();
      expect(mockFindMany).not.toHaveBeenCalled();
      expect(mockCount).not.toHaveBeenCalled();
    });

    it("keeps getAppointmentsByProvider front-desk only", async () => {
      asProvider("provider-a");

      const result = await getAppointmentsByProvider();

      expect(result.success).toBe(false);
      expect(mockGroupBy).not.toHaveBeenCalled();
    });
  });
});
