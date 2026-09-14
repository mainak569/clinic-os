import { prisma } from "@/lib/prisma";
import { subWeeks, startOfWeek, format } from "date-fns";

/**
 * Analytics Service Layer
 *
 * Provides optimized queries for dashboard analytics
 * All queries use selective field loading and aggregations
 */

export interface AppointmentsByProvider {
  providerId: string;
  providerName: string;
  count: number;
}

export interface AppointmentsByStatus {
  status: string;
  count: number;
  percentage: number;
}

export interface NoShowRateByWeek {
  week: string;
  weekStart: Date;
  totalAppointments: number;
  noShows: number;
  noShowRate: number;
}

export interface DashboardAnalytics {
  appointmentsByProvider: AppointmentsByProvider[];
  appointmentsByStatus: AppointmentsByStatus[];
  noShowRateLast8Weeks: NoShowRateByWeek[];
  summary: {
    totalAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    overallNoShowRate: number;
  };
}

/**
 * Summary counts from a status breakdown.
 *
 * The breakdown already covers every appointment matching the filter, so its
 * counts are the same numbers separate count queries would return.
 */
function summarizeByStatus(
  byStatus: AppointmentsByStatus[]
): DashboardAnalytics["summary"] {
  const count = (status: string) =>
    byStatus.find((s) => s.status === status)?.count ?? 0;

  const completedAppointments = count("COMPLETED");
  const noShowAppointments = count("NO_SHOW");
  const completedOrNoShow = completedAppointments + noShowAppointments;

  return {
    totalAppointments: byStatus.reduce((sum, s) => sum + s.count, 0),
    confirmedAppointments: count("CONFIRMED"),
    completedAppointments,
    cancelledAppointments: count("CANCELLED"),
    noShowAppointments,
    overallNoShowRate:
      completedOrNoShow > 0
        ? (noShowAppointments / completedOrNoShow) * 100
        : 0,
  };
}

export class AnalyticsService {
  /**
   * Get appointments by provider
   *
   * Optimized: Uses groupBy aggregation
   */
  async getAppointmentsByProvider(
    startDate?: Date,
    endDate?: Date
  ): Promise<AppointmentsByProvider[]> {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.scheduledAt = {};
      if (startDate) whereClause.scheduledAt.gte = startDate;
      if (endDate) whereClause.scheduledAt.lte = endDate;
    }

    // The counts and the provider names are independent, so fetch them
    // together instead of waiting for the counts before looking up names.
    const [results, providers] = await Promise.all([
      prisma.appointment.groupBy({
        by: ["providerId"],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
      }),
      prisma.provider.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          title: true,
        },
      }),
    ]);

    const providerMap = new Map(
      providers.map((p) => [
        p.id,
        `${p.title || "Dr."} ${p.firstName} ${p.lastName}`,
      ])
    );

    return results.map((result) => ({
      providerId: result.providerId,
      providerName: providerMap.get(result.providerId) || "Unknown",
      count: result._count.id,
    }));
  }

  /**
   * Get appointments by status
   *
   * Optimized: Uses groupBy aggregation
   */
  async getAppointmentsByStatus(
    startDate?: Date,
    endDate?: Date,
    providerId?: string
  ): Promise<AppointmentsByStatus[]> {
    // Without providerId this counts the whole clinic; providers must pass it.
    const whereClause: any = providerId ? { providerId } : {};

    if (startDate || endDate) {
      whereClause.scheduledAt = {};
      if (startDate) whereClause.scheduledAt.gte = startDate;
      if (endDate) whereClause.scheduledAt.lte = endDate;
    }

    // Use Prisma's groupBy for efficient aggregation
    const results = await prisma.appointment.groupBy({
      by: ["status"],
      where: whereClause,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
    });

    const total = results.reduce((sum, r) => sum + r._count.id, 0);

    return results.map((result) => ({
      status: result.status,
      count: result._count.id,
      percentage: total > 0 ? (result._count.id / total) * 100 : 0,
    }));
  }

  /**
   * Get no-show rate for last 8 weeks
   *
   * Optimized: Single query with date filtering and grouping
   */
  async getNoShowRateLast8Weeks(
    providerId?: string
  ): Promise<NoShowRateByWeek[]> {
    const now = new Date();
    const eightWeeksAgo = subWeeks(now, 8);

    // Get all appointments from last 8 weeks
    const appointments = await prisma.appointment.findMany({
      where: {
        ...(providerId ? { providerId } : {}),
        scheduledAt: {
          gte: eightWeeksAgo,
          lte: now,
        },
        status: {
          in: ["COMPLETED", "NO_SHOW"], // Only count appointments that happened
        },
      },
      select: {
        scheduledAt: true,
        status: true,
      },
    });

    // Group by week
    const weeklyData = new Map<string, { total: number; noShows: number }>();

    appointments.forEach((appt) => {
      const weekStart = startOfWeek(appt.scheduledAt, { weekStartsOn: 1 }); // Monday
      const weekKey = format(weekStart, "yyyy-MM-dd");

      if (!weeklyData.has(weekKey)) {
        weeklyData.set(weekKey, { total: 0, noShows: 0 });
      }

      const data = weeklyData.get(weekKey)!;
      data.total++;
      if (appt.status === "NO_SHOW") {
        data.noShows++;
      }
    });

    // Generate array for last 8 weeks (even if no data)
    const result: NoShowRateByWeek[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      const weekKey = format(weekStart, "yyyy-MM-dd");
      const data = weeklyData.get(weekKey) || { total: 0, noShows: 0 };

      result.push({
        week: `Week of ${format(weekStart, "MMM d")}`,
        weekStart,
        totalAppointments: data.total,
        noShows: data.noShows,
        noShowRate: data.total > 0 ? (data.noShows / data.total) * 100 : 0,
      });
    }

    return result;
  }

  /**
   * Get comprehensive dashboard analytics
   *
   * Optimized: Combines multiple queries efficiently
   */
  async getDashboardAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<DashboardAnalytics> {
    // Parallel queries. The summary counts come from the status breakdown,
    // which uses the same filter, rather than five more count queries.
    const [appointmentsByProvider, appointmentsByStatus, noShowRateLast8Weeks] =
      await Promise.all([
        this.getAppointmentsByProvider(startDate, endDate),
        this.getAppointmentsByStatus(startDate, endDate),
        this.getNoShowRateLast8Weeks(),
      ]);

    return {
      appointmentsByProvider,
      appointmentsByStatus,
      noShowRateLast8Weeks,
      summary: summarizeByStatus(appointmentsByStatus),
    };
  }

  /**
   * Get provider-specific analytics
   */
  async getProviderAnalytics(
    providerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<Omit<DashboardAnalytics, "appointmentsByProvider">> {
    // Both charts are scoped too; they previously showed the whole clinic.
    // The summary is derived from the scoped status breakdown.
    const [appointmentsByStatus, noShowRateLast8Weeks] = await Promise.all([
      this.getAppointmentsByStatus(startDate, endDate, providerId),
      this.getNoShowRateLast8Weeks(providerId),
    ]);

    return {
      appointmentsByStatus,
      noShowRateLast8Weeks,
      summary: summarizeByStatus(appointmentsByStatus),
    };
  }

  /**
   * Get recent appointment trends
   *
   * Useful for quick dashboard overview
   */
  async getRecentTrends(
    days = 30,
    providerId?: string
  ): Promise<{
    appointments: number;
    confirmed: number;
    completed: number;
    noShows: number;
    cancellations: number;
  }> {
    const startDate = subWeeks(new Date(), Math.ceil(days / 7));
    const scope = providerId ? { providerId } : {};

    const [total, confirmed, completed, noShows, cancellations] =
      await Promise.all([
        prisma.appointment.count({
          where: { ...scope, createdAt: { gte: startDate } },
        }),
        prisma.appointment.count({
          where: {
            ...scope,
            createdAt: { gte: startDate },
            status: "CONFIRMED",
          },
        }),
        prisma.appointment.count({
          where: {
            ...scope,
            createdAt: { gte: startDate },
            status: "COMPLETED",
          },
        }),
        prisma.appointment.count({
          where: { ...scope, createdAt: { gte: startDate }, status: "NO_SHOW" },
        }),
        prisma.appointment.count({
          where: {
            ...scope,
            createdAt: { gte: startDate },
            status: "CANCELLED",
          },
        }),
      ]);

    return {
      appointments: total,
      confirmed,
      completed,
      noShows,
      cancellations,
    };
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();
