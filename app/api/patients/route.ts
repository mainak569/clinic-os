import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { patientService } from "@/lib/services/patient.service";

/**
 * GET /api/patients
 * Fetch patients with optional pagination and search
 * 
 * Query params:
 * - query: Search term (optional)
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 100)
 * - includeInactive: Include inactive patients (default: false)
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "100", 10);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Get patients from service
    const result = await patientService.searchPatients({
      query,
      page,
      pageSize,
      includeInactive,
    });

    // Filter for PROVIDER role - only show patients they have appointments with
    if (session.user.role === "PROVIDER" && session.user.providerId) {
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

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}
