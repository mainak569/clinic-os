import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { getApiSession, canAccessProviderData } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { appointmentService } from "@/lib/services/appointment.service";
import { auditService } from "@/lib/services/audit.service";
import { createAppointmentSchema } from "@/lib/validations/appointment";
import { serializeAppointment } from "@/lib/serialize";

/**
 * GET /api/appointments
 *
 * Returns appointments based on user role:
 * - FRONT_DESK: All appointments
 * - PROVIDER: Only their own appointments
 */
export async function GET() {
  try {
    const session = await getApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role === "PROVIDER" && !session.user.providerId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const appointments = await prisma.appointment.findMany({
      where:
        session.user.role === "PROVIDER"
          ? { providerId: session.user.providerId! }
          : {},
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        provider: {
          select: { id: true, firstName: true, lastName: true, title: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({
      appointments: appointments.map((apt) => serializeAppointment(apt)),
      total: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/appointments
 *
 * Creates a new appointment through the same path as the in-app form:
 * validation, authorization, availability, conflict detection, history and
 * audit. This endpoint previously wrote straight to the database and skipped
 * all of them, so an API client could double-book or book outside a provider's
 * hours.
 */
export async function POST(request: Request) {
  try {
    const session = await getApiSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const input = createAppointmentSchema.parse(await request.json());

    const canAccess = await canAccessProviderData(input.providerId);
    if (!canAccess) {
      return NextResponse.json(
        { error: "Providers can only create appointments for themselves" },
        { status: 403 }
      );
    }

    const appointment = await appointmentService.createAppointment(
      {
        patientId: input.patientId,
        providerId: input.providerId,
        scheduledAt: input.scheduledAt,
        duration: input.duration,
        type: input.type,
        reason: input.reason,
        ...(input.notes ? { notes: input.notes } : {}),
      },
      session.user.id
    );

    const headersList = await headers();
    await auditService.log({
      userId: session.user.id,
      action: "CREATE",
      resource: "APPOINTMENT",
      resourceId: appointment.id,
      details: {
        patientId: input.patientId,
        providerId: input.providerId,
        scheduledAt: input.scheduledAt.toISOString(),
        via: "api",
      },
      ipAddress: headersList.get("x-forwarded-for") ?? null,
      userAgent: headersList.get("user-agent") ?? null,
    });

    return NextResponse.json(serializeAppointment(appointment), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid appointment", issues: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error) {
      // Business-rule rejections (unavailable, conflict, past, archived patient)
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
