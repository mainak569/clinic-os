"use server";

import { requireAuth } from "@/lib/auth-helpers";
import { appointmentService } from "@/lib/services/appointment.service";
import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from "date-fns";
import { serializeAppointment } from "@/lib/serialize";
import { actionErrorMessage } from "@/lib/action-error";

/**
 * Query Actions for Dashboard
 * 
 * Read-only actions for fetching dashboard data
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    const whereClause =
      session.user.role === "PROVIDER" && session.user.providerId
        ? { providerId: session.user.providerId }
        : {};

    const [appointmentsToday, checkedInToday, noShowsThisWeek, upcomingAppointments] =
      await Promise.all([
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
export async function getAppointments(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  providerId?: string;
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
}): Promise<
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

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const whereClause: any = {};

    // Role-based filtering
    if (session.user.role === "PROVIDER" && session.user.providerId) {
      whereClause.providerId = session.user.providerId;
    } else if (params.providerId) {
      whereClause.providerId = params.providerId;
    }

    // Status filter
    if (params.status) {
      whereClause.status = params.status;
    }

    // Date range filter
    if (params.startDate || params.endDate) {
      whereClause.scheduledAt = {};
      if (params.startDate) {
        whereClause.scheduledAt.gte = params.startDate;
      }
      if (params.endDate) {
        whereClause.scheduledAt.lte = params.endDate;
      }
    }

    // Search filter (patient name)
    if (params.search) {
      whereClause.patient = {
        OR: [
          { firstName: { contains: params.search, mode: "insensitive" } },
          { lastName: { contains: params.search, mode: "insensitive" } },
          { email: { contains: params.search, mode: "insensitive" } },
        ],
      };
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
      error:
        actionErrorMessage(error, "Failed to fetch calendar appointments"),
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

    const appointment = await appointmentService.getAppointmentById(appointmentId);

    if (!appointment) {
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
