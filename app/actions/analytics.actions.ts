"use server";

import { requireAuth } from "@/lib/auth-helpers";
import { analyticsService } from "@/lib/services/analytics.service";

/**
 * Analytics Server Actions
 * 
 * Provides optimized analytics data for dashboard
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get comprehensive dashboard analytics
 */
export async function getDashboardAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();

    // Front desk gets all analytics
    // Providers get only their own data
    let analytics;

    if (session.user.role === "FRONT_DESK") {
      analytics = await analyticsService.getDashboardAnalytics(
        startDate,
        endDate
      );
    } else if (session.user.providerId) {
      analytics = await analyticsService.getProviderAnalytics(
        session.user.providerId,
        startDate,
        endDate
      );
    } else {
      return { success: false, error: "Provider ID not found" };
    }

    return { success: true, data: analytics };
  } catch (error) {
    console.error("getDashboardAnalytics error:", error);
    return { success: false, error: "Failed to get analytics" };
  }
}

/**
 * Get appointments by provider
 * 
 * SECURITY: Only FRONT_DESK role can access cross-provider analytics
 */
export async function getAppointmentsByProvider(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<any[]>> {
  try {
    const session = await requireAuth();

    // Authorization check at top of function
    if (session.user.role !== "FRONT_DESK") {
      return {
        success: false,
        error: "Only front desk can view cross-provider analytics",
      };
    }

    const data = await analyticsService.getAppointmentsByProvider(
      startDate,
      endDate
    );

    return { success: true, data };
  } catch (error) {
    console.error("getAppointmentsByProvider error:", error);
    return { success: false, error: "Failed to get data" };
  }
}

/**
 * Get appointments by status
 * 
 * SECURITY: Authenticated users only (both roles allowed)
 */
export async function getAppointmentsByStatus(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<any[]>> {
  try {
    // Explicit authentication check
    await requireAuth();

    const data = await analyticsService.getAppointmentsByStatus(
      startDate,
      endDate
    );

    return { success: true, data };
  } catch (error) {
    console.error("getAppointmentsByStatus error:", error);
    return { success: false, error: "Failed to get data" };
  }
}

/**
 * Get no-show rate for last 8 weeks
 * 
 * SECURITY: Authenticated users only (both roles allowed)
 */
export async function getNoShowRateLast8Weeks(): Promise<ActionResult<any[]>> {
  try {
    // Explicit authentication check
    await requireAuth();

    const data = await analyticsService.getNoShowRateLast8Weeks();

    return { success: true, data };
  } catch (error) {
    console.error("getNoShowRateLast8Weeks error:", error);
    return { success: false, error: "Failed to get data" };
  }
}

/**
 * Get recent trends
 * 
 * SECURITY: Authenticated users only (both roles allowed)
 */
export async function getRecentTrends(
  days = 30
): Promise<ActionResult<any>> {
  try {
    // Explicit authentication check
    await requireAuth();

    const data = await analyticsService.getRecentTrends(days);

    return { success: true, data };
  } catch (error) {
    console.error("getRecentTrends error:", error);
    return { success: false, error: "Failed to get trends" };
  }
}
