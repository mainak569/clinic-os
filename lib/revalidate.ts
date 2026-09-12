import { revalidatePath } from "next/cache";

/**
 * Revalidate every route under the dashboard layout.
 *
 * Mutations previously revalidated paths that don't exist in this app
 * ("/appointments", "/availability", "/api/patients", "/providers/:id"), so the
 * real pages under /dashboard kept serving stale server-rendered data. The
 * "layout" scope covers /dashboard and every route nested beneath it.
 */
export function revalidateDashboard() {
  revalidatePath("/dashboard", "layout");
}
