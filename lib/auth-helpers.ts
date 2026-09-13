import { auth } from "@/auth";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

/**
 * Authorization Helpers
 * 
 * Security Principle: Never trust the frontend
 * All authorization checks happen server-side
 * 
 * Usage in Server Components, Server Actions, and API Routes
 */

/**
 * Requires user to be authenticated
 * Redirects to login if not authenticated
 * 
 * @returns Session with authenticated user
 * @throws Redirects to /login if not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  return session;
}

/**
 * Session for API routes, or null when not signed in.
 *
 * API routes can't use requireAuth: its redirect() throws, and a route's
 * try/catch turned that into a 500 (or a 409 "NEXT_REDIRECT"). Middleware
 * doesn't cover /api, so routes must answer 401 themselves.
 */
export async function getApiSession() {
  const session = await auth();
  return session?.user ? session : null;
}

/**
 * Requires user to have specific role(s)
 * 
 * @param allowedRoles - Single role or array of allowed roles
 * @returns Session with authenticated user
 * @throws Redirects to /unauthorized if wrong role
 * @throws Redirects to /login if not authenticated
 * 
 * @example
 * const session = await requireRole("PROVIDER");
 * const session = await requireRole(["PROVIDER", "FRONT_DESK"]);
 */
export async function requireRole(allowedRoles: Role | Role[]) {
  const session = await requireAuth();

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}

/**
 * Checks if user is a specific provider
 * Used to enforce provider data isolation
 * 
 * @param providerId - Provider ID to check
 * @returns true if user is the provider or is FRONT_DESK
 * 
 * @example
 * const canAccess = await canAccessProviderData(providerId);
 * if (!canAccess) throw new Error("Unauthorized");
 */
export async function canAccessProviderData(
  providerId: string
): Promise<boolean> {
  const session = await requireAuth();

  // FRONT_DESK can access all provider data
  if (session.user.role === "FRONT_DESK") {
    return true;
  }

  // PROVIDER can only access their own data
  if (session.user.role === "PROVIDER") {
    return session.user.providerId === providerId;
  }

  return false;
}

/**
 * Requires user to be the specific provider or FRONT_DESK
 * Throws error if unauthorized
 * 
 * @param providerId - Provider ID to check
 * @throws Error if user cannot access provider data
 * 
 * @example
 * await requireProviderAccess(providerId);
 */
export async function requireProviderAccess(providerId: string): Promise<void> {
  const canAccess = await canAccessProviderData(providerId);

  if (!canAccess) {
    throw new Error(
      "Unauthorized: You can only access your own provider data"
    );
  }
}

/**
 * Checks if current user is FRONT_DESK
 */
export async function isFrontDesk(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "FRONT_DESK";
}

/**
 * Checks if current user is PROVIDER
 */
export async function isProvider(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "PROVIDER";
}

/**
 * Gets current user's provider ID
 * Returns null if user is not a provider
 */
export async function getCurrentProviderId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.providerId || null;
}

/**
 * Authorization check for appointment access
 * 
 * Rules:
 * - FRONT_DESK: Can access all appointments
 * - PROVIDER: Can only access appointments where they are the provider
 * 
 * @param appointmentProviderId - Provider ID from the appointment
 * @returns true if user can access the appointment
 */
export async function canAccessAppointment(
  appointmentProviderId: string
): Promise<boolean> {
  return canAccessProviderData(appointmentProviderId);
}

/**
 * Authorization check for patient access
 * 
 * Rules:
 * - FRONT_DESK: Can access all patients
 * - PROVIDER: Can only access patients they have appointments with
 * 
 * @param patientId - Patient ID to check
 * @returns true if user can access the patient
 */
export async function canAccessPatient(patientId: string): Promise<boolean> {
  const session = await requireAuth();

  // FRONT_DESK can access all patients
  if (session.user.role === "FRONT_DESK") {
    return true;
  }

  // PROVIDER can only access patients they have appointments with
  if (session.user.role === "PROVIDER" && session.user.providerId) {
    const { prisma } = await import("@/prisma.config");

    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        providerId: session.user.providerId,
      },
    });

    return !!hasAppointment;
  }

  return false;
}
