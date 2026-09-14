"use server";

import { canAccessProviderData, requireAuth } from "@/lib/auth-helpers";
import { appointmentService } from "@/lib/services/appointment.service";
import { prisma } from "@/lib/prisma";
import {
  startOfClinicDay,
  endOfClinicDay,
  startOfClinicWeek,
  endOfClinicWeek,
} from "@/lib/clinic-time";
import { serializeAppointment } from "@/lib/serialize";
import { actionErrorMessage } from "@/lib/action-error";
import { wordsMatchAnyField } from "@/lib/db-search";
import {
  getAppointmentsSchema,
  type GetAppointmentsInput,
} from "@/lib/validations/appointment";

/**
 * Query Actions for Dashboard
 *
 * Read-only actions for fetching dashboard data
 */

type ActionResult<T> =
  { success: true; data: T } | { success: false; error: string };

/**
 * Get dashboard statistics for today
 */
export async function getDashboardStats(): Promise<
  ActionResult<{
    appointmentsToday: number;
    checkedInToday: number;
    noShowsThisWeek: number;
    upcomingAppointments: number;
  }>
> {
  try {
    const session = await requireAuth();
    if (session.user.role === "PROVIDER" && !session.user.providerId) {
      return { success: false, error: "Provider ID not found" };
    }

    const now = new Date();
    // Day/week boundaries on the clinic's clock, not the server's — date-fns'
    // startOfDay/startOfWeek use the server's own timezone, which is
    // Asia/Kolkata on a laptop but UTC on Vercel. Without this, "today" and
    // "this week" silently shift by CLINIC_TIME_ZONE's UTC offset in
    // production (see AUDIT.md Goal 8 / G8-1).
    const todayStart = startOfClinicDay(now);
    const todayEnd = endOfClinicDay(now);
    // Monday-to-Sunday, the same weeks the no-show trend chart uses.
    const weekStart = startOfClinicWeek(now);
    const weekEnd = endOfClinicWeek(now);

    const whereClause =
      session.user.role === "PROVIDER" && session.user.providerId
        ? { providerId: session.user.providerId }
        : {};

    const [
      appointmentsToday,
      checkedInToday,
      noShowsThisWeek,
      upcomingAppointments,
    ] = await Promise.all([
      // Appointments today
      prisma.appointment.count({
        where: {
          ...whereClause,
          scheduledAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: {
            in: ["REQUESTED", "CONFIRMED", "CHECKED_IN"],
          },
        },
      }),
      // Checked in today
      prisma.appointment.count({
        where: {
          ...whereClause,
          checkedInAt: {
            gte: todayStart,
            lte: todayEnd,
          },
          // Everyone who arrived today, including those already seen.
          // Counting only CHECKED_IN made the number drop as visits finished.
          status: { in: ["CHECKED_IN", "COMPLETED"] },
        },
      }),
      // No shows this week
      prisma.appointment.count({
        where: {
          ...whereClause,
          status: "NO_SHOW",
          scheduledAt: {
            gte: weekStart,
            lte: weekEnd,
          },
        },
      }),
      // Upcoming appointments (future)
      prisma.appointment.count({
        where: {
          ...whereClause,
          scheduledAt: {
            gt: now,
          },
          status: {
            in: ["REQUESTED", "CONFIRMED"],
          },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        appointmentsToday,
        checkedInToday,
        noShowsThisWeek,
        upcomingAppointments,
      },
    };
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to fetch stats"),
    };
  }
}

/**
 * Get appointments with filters and pagination
 */
export async function getAppointments(params: GetAppointmentsInput): Promise<
  ActionResult<{
    appointments: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>
> {
  try {
    const session = await requireAuth();
    if (session.user.role === "PROVIDER" && !session.user.providerId) {
      return { success: false, error: "Provider ID not found" };
    }

    // page/pageSize come straight from the client; without this an out-of-range
    // page (0, negative, huge) either silently changed what was returned or
    // reached Prisma unvalidated and came back as a raw engine error.
    const validated = getAppointmentsSchema.parse(params);
    const { page, pageSize } = validated;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {};

    // Role-based filtering
    if (session.user.role === "PROVIDER" && session.user.providerId) {
      whereClause.providerId = session.user.providerId;
    } else if (validated.providerId) {
      whereClause.providerId = validated.providerId;
    }

    // Status filter
    if (validated.status) {
      whereClause.status = validated.status;
    }

    // Date range filter
    if (validated.startDate || validated.endDate) {
      whereClause.scheduledAt = {};
      if (validated.startDate) {
        whereClause.scheduledAt.gte = validated.startDate;
      }
      if (validated.endDate) {
        whereClause.scheduledAt.lte = validated.endDate;
      }
    }

    // Search filter (patient name or email). Every word must match, so a full
    // name like "John Davis" works; each word is escaped so "%" or "_" is
    // matched literally rather than as a SQL wildcard.
    if (validated.search) {
      whereClause.patient = wordsMatchAnyField(validated.search, [
        "firstName",
        "lastName",
        "email",
      ]);
    }

    // Fetch appointments with pagination
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              dateOfBirth: true,
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
          scheduledAt: "desc",
        },
        skip,
        take: pageSize,
      }),
      prisma.appointment.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    // Serialize Decimal fields for client components
    const serializedAppointments = appointments.map((apt) => ({
      ...apt,
      cost: apt.cost ? Number(apt.cost) : null,
    }));

    return {
      success: true,
      data: {
        appointments: serializedAppointments,
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error("getAppointments error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to fetch appointments"),
    };
  }
}

/**
 * Get all providers (for filters)
 */
export async function getProviders(): Promise<ActionResult<any[]>> {
  try {
    await requireAuth();

    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return { success: true, data: providers };
  } catch (error) {
    console.error("getProviders error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to fetch providers"),
    };
  }
}

/**
 * Get appointments for calendar view
 */
export async function getCalendarAppointments(params: {
  start: Date;
  end: Date;
}): Promise<ActionResult<any[]>> {
  try {
    const session = await requireAuth();
    if (session.user.role === "PROVIDER" && !session.user.providerId) {
      return { success: false, error: "Provider ID not found" };
    }

    const whereClause: any = {
      scheduledAt: {
        gte: params.start,
        lte: params.end,
      },
    };

    // Providers only see their own appointments
    if (session.user.role === "PROVIDER" && session.user.providerId) {
      whereClause.providerId = session.user.providerId;
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
    });

    // Serialize Decimal fields for client components
    const serializedAppointments = appointments.map((apt) => ({
      ...apt,
      cost: apt.cost ? Number(apt.cost) : null,
    }));

    return { success: true, data: serializedAppointments };
  } catch (error) {
    console.error("getCalendarAppointments error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to fetch calendar appointments"),
    };
  }
}

/**
 * Get single appointment by ID
 */
export async function getAppointmentById(
  appointmentId: string
): Promise<ActionResult<any>> {
  try {
    await requireAuth();

    const appointment =
      await appointmentService.getAppointmentDetails(appointmentId);

    if (!appointment) {
      return { success: false, error: "Appointment not found" };
    }

    // Provider isolation: a provider can only open their own appointments.
    // Reported as not found so other providers' appointment IDs aren't confirmed.
    if (!(await canAccessProviderData(appointment.providerId))) {
      return { success: false, error: "Appointment not found" };
    }

    // Serialize Decimal fields (cost, and visit-note vitals) for client components
    const serializedAppointment = serializeAppointment(appointment as any);

    return { success: true, data: serializedAppointment };
  } catch (error) {
    console.error("getAppointmentById error:", error);
    return {
      success: false,
      error: actionErrorMessage(error, "Failed to fetch appointment"),
    };
  }
}
