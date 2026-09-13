"use server";

import { requireAuth } from "@/lib/auth-helpers";
import { analyticsService } from "@/lib/services/analytics.service";

/**
 * Analytics Server Actions
 *
 * Provider isolation applies to every action here: FRONT_DESK sees the whole
 * clinic, a PROVIDER only ever sees their own appointments. Several actions
 * used to run clinic-wide queries for any signed-in user, so a provider's
 * status chart and no-show trend included every other provider's patients.
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type Session = Awaited<ReturnType<typeof requireAuth>>;

/**
 * The provider filter for this user: `null` provider means the whole clinic
 * (front desk). Returns an error result for a provider account that has no
 * linked provider, rather than falling back to clinic-wide data.
 */
function analyticsScope(
  session: Session
): { providerId: string | undefined } | { error: string } {
  if (session.user.role === "FRONT_DESK") {
    return { providerId: undefined };
  }
  if (session.user.providerId) {
    return { providerId: session.user.providerId };
  }
  return { error: "Provider ID not found" };
}

/**
 * Get comprehensive dashboard analytics
 */
export async function getDashboardAnalytics(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    const scope = analyticsScope(session);
    if ("error" in scope) {
      return { success: false, error: scope.error };
    }

    const analytics = scope.providerId
      ? await analyticsService.getProviderAnalytics(scope.providerId, startDate, endDate)
      : await analyticsService.getDashboardAnalytics(startDate, endDate);

    return { success: true, data: analytics };
  } catch (error) {
    console.error("getDashboardAnalytics error:", error);
    return { success: false, error: "Failed to get analytics" };
  }
}

/**
 * Get appointments by provider
 *
 * SECURITY: Cross-provider by definition, so FRONT_DESK only.
 */
export async function getAppointmentsByProvider(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<any[]>> {
  try {
    const session = await requireAuth();

    if (session.user.role !== "FRONT_DESK") {
      return {
        success: false,
        error: "Only front desk can view cross-provider analytics",
      };
    }

    const data = await analyticsService.getAppointmentsByProvider(startDate, endDate);

    return { success: true, data };
  } catch (error) {
    console.error("getAppointmentsByProvider error:", error);
    return { success: false, error: "Failed to get data" };
  }
}

/**
 * Get appointments by status
 *
 * SECURITY: Providers see only their own appointments.
 */
export async function getAppointmentsByStatus(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<any[]>> {
  try {
    const session = await requireAuth();
    const scope = analyticsScope(session);
    if ("error" in scope) {
      return { success: false, error: scope.error };
    }

    const data = await analyticsService.getAppointmentsByStatus(
      startDate,
      endDate,
      scope.providerId
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
 * SECURITY: Providers see only their own appointments.
 */
export async function getNoShowRateLast8Weeks(): Promise<ActionResult<any[]>> {
  try {
    const session = await requireAuth();
    const scope = analyticsScope(session);
    if ("error" in scope) {
      return { success: false, error: scope.error };
    }

    const data = await analyticsService.getNoShowRateLast8Weeks(scope.providerId);

    return { success: true, data };
  } catch (error) {
    console.error("getNoShowRateLast8Weeks error:", error);
    return { success: false, error: "Failed to get data" };
  }
}

/**
 * Get recent trends
 *
 * SECURITY: Providers see only their own appointments.
 */
export async function getRecentTrends(days = 30): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();
    const scope = analyticsScope(session);
    if ("error" in scope) {
      return { success: false, error: scope.error };
    }

    const data = await analyticsService.getRecentTrends(days, scope.providerId);

    return { success: true, data };
  } catch (error) {
    console.error("getRecentTrends error:", error);
    return { success: false, error: "Failed to get trends" };
  }
}
