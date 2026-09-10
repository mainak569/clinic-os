import { requireAuth, canAccessProviderData } from "@/lib/auth-helpers";
import { prisma } from "@/prisma.config";
import { NextResponse } from "next/server";

/**
 * GET /api/providers/[providerId]
 * 
 * Returns provider details with authorization check
 * 
 * Authorization:
 * - FRONT_DESK: Can access any provider
 * - PROVIDER: Can only access their own data
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    await requireAuth();
    const { providerId } = await params;

    // Authorization check
    const canAccess = await canAccessProviderData(providerId);
    if (!canAccess) {
      return NextResponse.json(
        { 
          error: "Unauthorized: You can only access your own provider data",
          message: "Providers can only view their own information. Front desk staff can view all providers."
        },
        { status: 403 }
      );
    }

    // Fetch provider data
    const provider = await prisma.provider.findUnique({
      where: { id: providerId },
      include: {
        profile: true,
        user: {
          select: {
            email: true,
            isActive: true,
            lastLogin: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            availabilitySlots: true,
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(provider);
  } catch (error) {
    console.error("Error fetching provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/providers/[providerId]
 * 
 * Updates provider information
 * 
 * Authorization:
 * - FRONT_DESK: Can update any provider
 * - PROVIDER: Can only update their own data
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    await requireAuth();
    const { providerId } = await params;

    // Authorization check
    const canAccess = await canAccessProviderData(providerId);
    if (!canAccess) {
      return NextResponse.json(
        { error: "Unauthorized: You can only update your own provider data" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, title, profile } = body;

    // Update provider
    const updatedProvider = await prisma.provider.update({
      where: { id: providerId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(title && { title }),
        ...(profile && {
          profile: {
            upsert: {
              create: profile,
              update: profile,
            },
          },
        }),
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json(updatedProvider);
  } catch (error) {
    console.error("Error updating provider:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
