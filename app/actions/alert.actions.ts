"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-helpers";
import { alertService } from "@/lib/services/alert.service";

/**
 * Alert Server Actions
 * 
 * Handles alert management and generation
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Get alerts for current provider
 */
export async function getMyAlerts(includeRead = false): Promise<
  ActionResult<any[]>
> {
  try {
    const session = await requireAuth();

    if (!session.user.providerId) {
      return { success: false, error: "Provider ID not found" };
    }

    const alerts = await alertService.getProviderAlerts(
      session.user.providerId,
      includeRead
    );

    return { success: true, data: alerts };
  } catch (error) {
    console.error("getMyAlerts error:", error);
    return { success: false, error: "Failed to get alerts" };
  }
}

/**
 * Get unread alert count
 */
export async function getUnreadAlertCount(): Promise<ActionResult<number>> {
  try {
    const session = await requireAuth();

    if (!session.user.providerId) {
      return { success: false, error: "Provider ID not found" };
    }

    const count = await alertService.getUnreadCount(session.user.providerId);

    return { success: true, data: count };
  } catch (error) {
    console.error("getUnreadAlertCount error:", error);
    return { success: false, error: "Failed to get alert count" };
  }
}

/**
 * Mark alert as read
 */
export async function markAlertRead(alertId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();

    const alert = await alertService.markAlertAsRead(alertId);

    revalidatePath("/dashboard");

    return { success: true, data: { id: alert.id } };
  } catch (error) {
    console.error("markAlertRead error:", error);
    return { success: false, error: "Failed to mark alert as read" };
  }
}

/**
 * Mark all alerts as read
 */
export async function markAllAlertsRead(): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireAuth();

    if (!session.user.providerId) {
      return { success: false, error: "Provider ID not found" };
    }

    const result = await alertService.markAllAlertsAsRead(
      session.user.providerId
    );

    revalidatePath("/dashboard");

    return { success: true, data: result };
  } catch (error) {
    console.error("markAllAlertsRead error:", error);
    return { success: false, error: "Failed to mark alerts as read" };
  }
}

/**
 * Dismiss alert
 */
export async function dismissAlert(alertId: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAuth();

    const alert = await alertService.dismissAlert(alertId);

    revalidatePath("/dashboard");

    return { success: true, data: { id: alert.id } };
  } catch (error) {
    console.error("dismissAlert error:", error);
    return { success: false, error: "Failed to dismiss alert" };
  }
}

/**
 * Generate alerts for provider
 */
export async function generateAlerts(): Promise<
  ActionResult<{ upcoming: number; urgent: number }>
> {
  try {
    const session = await requireAuth();

    if (!session.user.providerId) {
      return { success: false, error: "Provider ID not found" };
    }

    const result = await alertService.generateAllAlerts(
      session.user.providerId
    );

    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        upcoming: result.upcoming.length,
        urgent: result.urgent.length,
      },
    };
  } catch (error) {
    console.error("generateAlerts error:", error);
    return { success: false, error: "Failed to generate alerts" };
  }
}
