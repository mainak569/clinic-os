import { auth } from "@/auth";

/**
 * Server-side session utilities
 * 
 * These functions provide convenient access to session data
 * in Server Components, Server Actions, and API Routes
 */

/**
 * Get current session (may be null if not authenticated)
 */
export async function getSession() {
  return await auth();
}

/**
 * Get current user (may be null if not authenticated)
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}
