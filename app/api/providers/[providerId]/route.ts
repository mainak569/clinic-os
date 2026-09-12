import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireAuth, canAccessProviderData } from "@/lib/auth-helpers";
import { providerService } from "@/lib/services/provider.service";
import { prisma } from "@/lib/prisma";
import { updateProviderSchema } from "@/lib/validations/provider";

/**
 * GET /api/providers/[providerId]
 *
 * Provider details with active availability.
 * - FRONT_DESK: any provider
 * - PROVIDER: only themselves
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    await requireAuth();
    const { providerId } = await params;

    if (!(await canAccessProviderData(providerId))) {
      return NextResponse.json(
        {
          error: "Unauthorized: You can only access your own provider data",
          message:
            "Providers can only view their own information. Front desk staff can view all providers.",
        },
        { status: 403 }
      );
    }

    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        profile: true,
        user: { select: { email: true, isActive: true, lastLogin: true } },
        availabilitySlots: {
          where: { isActive: true },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        },
        _count: { select: { appointments: true, availabilitySlots: true } },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error fetching provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/providers/[providerId]
 *
 * Updates a provider through the same validated service as the Providers page.
 * The body was previously written straight into the database, including an
 * unvalidated `profile` object passed to an upsert.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    await requireAuth();
    const { providerId } = await params;

    if (!(await canAccessProviderData(providerId))) {
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own provider data" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const input = updateProviderSchema.parse({ ...body, id: providerId });
    const updated = await providerService.updateProvider(input);

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid provider", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error updating provider:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
