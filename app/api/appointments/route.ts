import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/prisma.config";
import { NextResponse } from "next/server";

/**
 * GET /api/appointments
 * 
 * Returns appointments based on user role:
 * - FRONT_DESK: All appointments
 * - PROVIDER: Only their own appointments
 * 
 * This demonstrates backend authorization enforcement.
 */
export async function GET() {
  try {
    const session = await requireAuth();

    let appointments;

    if (session.user.role === "FRONT_DESK") {
      // Front desk can see all appointments
      appointments = await prisma.appointment.findMany({
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
            },
          },
        },
        orderBy: {
          scheduledAt: "asc",
        },
      });
    } else if (session.user.role === "PROVIDER" && session.user.providerId) {
      // Provider can only see their own appointments
      appointments = await prisma.appointment.findMany({
        where: {
          providerId: session.user.providerId,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
            },
          },
        },
        orderBy: {
          scheduledAt: "asc",
        },
      });
    } else {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      appointments,
      total: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/appointments
 * 
 * Creates a new appointment
 * Both FRONT_DESK and PROVIDER can create appointments
 * PROVIDER can only create appointments for themselves
 */
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { patientId, providerId, scheduledAt, duration, type, reason } = body;

    // Validate required fields
    if (!patientId || !providerId || !scheduledAt) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Authorization check: Provider can only create for themselves
    if (session.user.role === "PROVIDER") {
      if (session.user.providerId !== providerId) {
        return NextResponse.json(
          { error: "Providers can only create appointments for themselves" },
          { status: 403 }
        );
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        providerId,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 30,
        type: type || "FOLLOW_UP",
        reason,
        status: "REQUESTED",
      },
      include: {
        patient: true,
        provider: true,
      },
    });

    // Create appointment history
    await prisma.appointmentHistory.create({
      data: {
        appointmentId: appointment.id,
        action: "CREATED",
        newValue: "REQUESTED",
        performedBy: session.user.id,
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
