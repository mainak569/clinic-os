"use server";

import { getDashboardAnalytics } from "@/app/actions/analytics.actions";
import { getDashboardStats } from "@/app/actions/queries.actions";

/**
 * Dashboard overview in a single Server Action.
 *
 * The browser runs Server Actions one at a time, so calling the analytics and
 * stats actions separately made the second wait for the first. Called here on
 * the server they run in parallel. Each still checks the session and scopes
 * its data to the user's role.
 */
export async function getDashboardOverview() {
  const [analytics, stats] = await Promise.all([
    getDashboardAnalytics(),
    getDashboardStats(),
  ]);

  return { analytics, stats };
}
