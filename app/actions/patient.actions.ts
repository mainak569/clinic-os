"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { requireAuth, requireRole, canAccessPatient } from "@/lib/auth-helpers";
import { patientService } from "@/lib/services/patient.service";
import { auditService } from "@/lib/services/audit.service";
import {
  createPatientSchema,
  updatePatientSchema,
  deletePatientSchema,
  searchPatientsSchema,
  getPatientByIdSchema,
  type CreatePatientInput,
  type UpdatePatientInput,
  type DeletePatientInput,
  type SearchPatientsInput,
  type GetPatientByIdInput,
} from "@/lib/validations/patient";

/**
 * Patient Server Actions
 * 
 * Handles authorization and delegates business logic to service layer
 * Returns { success, data?, error? } for client consumption
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Create a new patient
 * Authorization: FRONT_DESK only
 */
export async function createPatient(
  input: CreatePatientInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole("FRONT_DESK");

    // Validate input
    const validatedInput = createPatientSchema.parse(input);

    // Business logic
    const patient = await patientService.createPatient({
      firstName: validatedInput.firstName,
      lastName: validatedInput.lastName,
      email: validatedInput.email || null,
      phone: validatedInput.phone || null,
      dateOfBirth: validatedInput.dateOfBirth || null,
      address: validatedInput.address || null,
      city: validatedInput.city || null,
      state: validatedInput.state || null,
      zipCode: validatedInput.zipCode || null,
      emergencyContactName: validatedInput.emergencyContactName || null,
      emergencyContactPhone: validatedInput.emergencyContactPhone || null,
      insuranceProvider: validatedInput.insuranceProvider || null,
      insuranceId: validatedInput.insuranceId || null,
      allergies: validatedInput.allergies || null,
      medications: validatedInput.medications || null,
      medicalHistory: validatedInput.medicalHistory || null,
    });

    // HIPAA Audit Log
    const headersList = await headers();
    await auditService.log({
      userId: session.user.id,
      action: "CREATE",
      resource: "PATIENT",
      resourceId: patient.id,
      details: {
        firstName: validatedInput.firstName,
        lastName: validatedInput.lastName,
        email: validatedInput.email,
        phone: validatedInput.phone,
      },
      ipAddress: headersList.get("x-forwarded-for") ?? null,
      userAgent: headersList.get("user-agent") ?? null,
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard/patients");
    revalidatePath("/api/patients");

    return { success: true, data: { id: patient.id } };
  } catch (error) {
    console.error("createPatient error:", error);

    // Send to Sentry
    if (typeof window === 'undefined') {
      const Sentry = await import('@sentry/nextjs');
      Sentry.captureException(error, {
        tags: { action: "createPatient" },
      });
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to create patient" };
  }
}

/**
 * Update an existing patient
 * Authorization: FRONT_DESK only
 */
export async function updatePatient(
  input: UpdatePatientInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole("FRONT_DESK");

    // Validate input
    const validatedInput = updatePatientSchema.parse(input);

    // Business logic
    const updated = await patientService.updatePatient(validatedInput.id, {
      firstName: validatedInput.firstName,
      lastName: validatedInput.lastName,
      email: validatedInput.email || null,
      phone: validatedInput.phone || null,
      dateOfBirth: validatedInput.dateOfBirth || null,
      address: validatedInput.address || null,
      city: validatedInput.city || null,
      state: validatedInput.state || null,
      zipCode: validatedInput.zipCode || null,
      emergencyContactName: validatedInput.emergencyContactName || null,
      emergencyContactPhone: validatedInput.emergencyContactPhone || null,
      insuranceProvider: validatedInput.insuranceProvider || null,
      insuranceId: validatedInput.insuranceId || null,
      allergies: validatedInput.allergies || null,
      medications: validatedInput.medications || null,
      medicalHistory: validatedInput.medicalHistory || null,
    });

    // HIPAA Audit Log
    const headersList = await headers();
    await auditService.log({
      userId: session.user.id,
      action: "UPDATE",
      resource: "PATIENT",
      resourceId: validatedInput.id,
      details: {
        fields: Object.keys(validatedInput).filter((k) => k !== "id"),
      },
      ipAddress: headersList.get("x-forwarded-for") ?? null,
      userAgent: headersList.get("user-agent") ?? null,
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard/patients");
    revalidatePath(`/dashboard/patients/${validatedInput.id}`);
    revalidatePath("/api/patients");

    return { success: true, data: { id: updated.id } };
  } catch (error) {
    console.error("updatePatient error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to update patient" };
  }
}

/**
 * Delete (soft delete) a patient
 * Authorization: FRONT_DESK only
 */
export async function deletePatient(
  input: DeletePatientInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireRole("FRONT_DESK");

    // Validate input
    const validatedInput = deletePatientSchema.parse(input);

    // Business logic (includes check for future appointments)
    const deleted = await patientService.deletePatient(validatedInput.id);

    // HIPAA Audit Log
    const headersList = await headers();
    await auditService.log({
      userId: session.user.id,
      action: "DELETE",
      resource: "PATIENT",
      resourceId: validatedInput.id,
      details: {
        firstName: deleted.firstName,
        lastName: deleted.lastName,
      },
      ipAddress: headersList.get("x-forwarded-for") ?? null,
      userAgent: headersList.get("user-agent") ?? null,
    });

    // Revalidate relevant paths
    revalidatePath("/dashboard/patients");
    revalidatePath("/api/patients");

    return { success: true, data: { id: deleted.id } };
  } catch (error) {
    console.error("deletePatient error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to delete patient" };
  }
}

/**
 * Search/list patients with pagination
 * Authorization: All authenticated users
 * PROVIDER: Only sees patients they have appointments with
 * FRONT_DESK: Sees all patients
 */
export async function searchPatients(
  input?: SearchPatientsInput
): Promise<ActionResult<{
  patients: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = searchPatientsSchema.parse(input || {});

    // Business logic
    const result = await patientService.searchPatients({
      query: validatedInput.query,
      page: validatedInput.page,
      pageSize: validatedInput.pageSize,
      includeInactive: validatedInput.includeInactive,
    });

    // Filter patients based on role
    if (session.user.role === "PROVIDER" && session.user.providerId) {
      // Providers only see patients they have appointments with
      const { prisma } = await import("@/lib/prisma");
      
      const patientIds = await prisma.appointment.findMany({
        where: {
          providerId: session.user.providerId,
        },
        select: {
          patientId: true,
        },
        distinct: ["patientId"],
      });

      const accessiblePatientIds = new Set(patientIds.map((a) => a.patientId));
      
      result.patients = result.patients.filter((p) =>
        accessiblePatientIds.has(p.id)
      );
      result.total = result.patients.length;
      result.totalPages = Math.ceil(result.total / result.pageSize);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error("searchPatients error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to search patients" };
  }
}

/**
 * Get patient by ID with full details including appointments
 * Authorization: Check if user can access this patient
 */
export async function getPatientById(
  input: GetPatientByIdInput
): Promise<ActionResult<any>> {
  try {
    const session = await requireAuth();

    // Validate input
    const validatedInput = getPatientByIdSchema.parse(input);

    // Authorization check
    const canAccess = await canAccessPatient(validatedInput.id);
    if (!canAccess) {
      return {
        success: false,
        error: "You do not have permission to access this patient",
      };
    }

    // Business logic
    const patient = await patientService.getPatientWithAppointments(
      validatedInput.id
    );

    if (!patient) {
      return { success: false, error: "Patient not found" };
    }

    // HIPAA Audit Log (READ operation)
    const headersList = await headers();
    await auditService.log({
      userId: session.user.id,
      action: "READ",
      resource: "PATIENT",
      resourceId: validatedInput.id,
      details: {
        includesAppointments: true,
      },
      ipAddress: headersList.get("x-forwarded-for") ?? null,
      userAgent: headersList.get("user-agent") ?? null,
    });

    return { success: true, data: patient };
  } catch (error) {
    console.error("getPatientById error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to get patient" };
  }
}

/**
 * Get patient appointment count
 * Authorization: Check if user can access this patient
 */
export async function getPatientAppointmentCount(
  patientId: string
): Promise<ActionResult<{ count: number }>> {
  try {
    await requireAuth();

    // Authorization check
    const canAccess = await canAccessPatient(patientId);
    if (!canAccess) {
      return {
        success: false,
        error: "You do not have permission to access this patient",
      };
    }

    const count = await patientService.getPatientAppointmentCount(patientId);

    return { success: true, data: { count } };
  } catch (error) {
    console.error("getPatientAppointmentCount error:", error);

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: "Failed to get appointment count" };
  }
}
