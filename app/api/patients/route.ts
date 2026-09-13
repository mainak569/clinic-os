import { NextResponse } from "next/server";
import { getApiSession } from "@/lib/auth-helpers";
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
    const session = await getApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("query") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "100", 10);
    const includeInactive = searchParams.get("includeInactive") === "true";

    // Providers only see patients they have appointments with, filtered in the
    // database so pagination and totals are correct.
    if (session.user.role === "PROVIDER" && !session.user.providerId) {
      return NextResponse.json({ patients: [], total: 0, page, pageSize, totalPages: 0 });
    }

    const result = await patientService.searchPatients({
      query,
      page,
      pageSize,
      includeInactive,
      ...(session.user.role === "PROVIDER" && session.user.providerId
        ? { providerId: session.user.providerId }
        : {}),
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Failed to fetch patients" },
      { status: 500 }
    );
  }
}
