import { prisma } from "@/lib/prisma";
import type { Alert, AlertType, AlertPriority } from "@prisma/client";
import { addHours, subHours } from "date-fns";
import { formatClinicDateTime } from "@/lib/clinic-time";

/**
 * Alert Service Layer
 *
 * Manages alerts for appointment reminders and notifications
 * Optimized queries with selective field loading
 */

export interface AppointmentAlert {
  id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  appointmentId: string;
  appointment: {
    id: string;
    scheduledAt: Date;
    status: string;
    patient: {
      firstName: string;
      lastName: string;
    };
  };
  createdAt: Date;
  isRead: boolean;
}

export class AlertService {
  /**
   * Generate alerts for requested appointments within 24 hours
   *
   * Creates alerts for appointments that are:
   * - Status: REQUESTED
   * - Scheduled within next 24 hours
   * - Don't already have an alert
   */
  async generateUpcomingAppointmentAlerts(
    providerId: string
  ): Promise<Alert[]> {
    const now = new Date();
    const next24Hours = addHours(now, 24);

    // Find REQUESTED appointments in next 24 hours without existing alerts
    const appointments = await prisma.appointment.findMany({
      where: {
        providerId,
        status: "REQUESTED",
        scheduledAt: {
          gte: now,
          lte: next24Hours,
        },
      },
      select: {
        id: true,
        scheduledAt: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const alerts: Alert[] = [];

    for (const appointment of appointments) {
      // Check if alert already exists
      const existingAlert = await prisma.alert.findFirst({
        where: {
          providerId,
          type: "APPOINTMENT_REMINDER",
          // The appointment id lives in the message, not the title. Matching on
          // the title never found anything, so every run created duplicates.
          message: {
            contains: `[ID: ${appointment.id}]`,
          },
          createdAt: {
            gte: subHours(now, 25), // Look back 25 hours
          },
        },
      });

      if (!existingAlert) {
        const alert = await prisma.alert.create({
          data: {
            providerId,
            type: "APPOINTMENT_REMINDER",
            priority: "MEDIUM",
            title: `Unconfirmed: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
            message: `Appointment scheduled for ${formatClinicDateTime(appointment.scheduledAt)} is still REQUESTED. Confirm or follow up with patient. [ID: ${appointment.id}]`,
            expiresAt: appointment.scheduledAt,
          },
        });

        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Generate urgent alerts for REQUESTED appointments starting within the next hour
   */
  async generateUrgentAppointmentAlerts(providerId: string): Promise<Alert[]> {
    const now = new Date();
    const oneHourFromNow = addHours(now, 1);

    // REQUESTED appointments starting within the next hour. The window used to
    // be 1-2 hours ahead, so the "in 1 hour" alert fired up to 2 hours early
    // and never for an appointment already inside its last hour.
    const appointments = await prisma.appointment.findMany({
      where: {
        providerId,
        status: "REQUESTED",
        scheduledAt: {
          gt: now,
          lte: oneHourFromNow,
        },
      },
      select: {
        id: true,
        scheduledAt: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const alerts: Alert[] = [];

    for (const appointment of appointments) {
      // Check if urgent alert already exists
      const existingAlert = await prisma.alert.findFirst({
        where: {
          providerId,
          type: "APPOINTMENT_REMINDER",
          priority: "HIGH",
          message: {
            contains: `[ID: ${appointment.id}]`,
          },
          createdAt: {
            gte: subHours(now, 2),
          },
        },
      });

      if (!existingAlert) {
        const alert = await prisma.alert.create({
          data: {
            providerId,
            type: "APPOINTMENT_REMINDER",
            priority: "HIGH",
            title: `URGENT: ${appointment.patient.firstName} ${appointment.patient.lastName}`,
            message: `Appointment within the hour (${formatClinicDateTime(appointment.scheduledAt)}) is STILL UNCONFIRMED! Take immediate action. [ID: ${appointment.id}]`,
            expiresAt: appointment.scheduledAt,
          },
        });

        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Get active alerts for provider
   *
   * Returns unread or recent alerts, ordered by priority and date
   */
  async getProviderAlerts(
    providerId: string,
    includeRead = false
  ): Promise<AppointmentAlert[]> {
    const now = new Date();

    const alerts = await prisma.alert.findMany({
      where: {
        providerId,
        isDismissed: false,
        ...(includeRead ? {} : { isRead: false }),
        OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" }, // HIGH, MEDIUM, LOW, CRITICAL
        { createdAt: "desc" },
      ],
      take: 50, // Limit to recent 50 alerts
    });

    // Extract appointment IDs from messages, then fetch every appointment in
    // one query rather than one `findUnique` per alert — this runs on a path
    // polled every 30s by the header bell for every signed-in provider, so an
    // N+1 here means N+1 queries on every poll, not just once.
    const idsByAlert = new Map<string, string>();
    for (const alert of alerts) {
      const match = alert.message.match(/\[ID: ([^\]]+)\]/);
      if (match) idsByAlert.set(alert.id, match[1]);
    }

    const appointments = await prisma.appointment.findMany({
      where: { id: { in: [...new Set(idsByAlert.values())] } },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    const appointmentById = new Map(appointments.map((a) => [a.id, a]));

    const enrichedAlerts: AppointmentAlert[] = [];
    for (const alert of alerts) {
      const appointmentId = idsByAlert.get(alert.id);
      if (!appointmentId) continue;

      const appointment = appointmentById.get(appointmentId);

      // An "unconfirmed" alert only means something while the appointment is
      // still REQUESTED. Once it is confirmed (or cancelled, or otherwise
      // moved on) the alert stops showing, whoever changed it.
      if (appointment && appointment.status === "REQUESTED") {
        enrichedAlerts.push({
          id: alert.id,
          type: alert.type,
          priority: alert.priority,
          title: alert.title,
          message: alert.message,
          appointmentId: appointment.id,
          appointment: appointment as any,
          createdAt: alert.createdAt,
          isRead: alert.isRead,
        });
      }
    }

    return enrichedAlerts;
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(
    alertId: string,
    providerId: string
  ): Promise<{ id: string }> {
    // Scoped to the provider, so nobody can change another provider's alerts by id.
    const result = await prisma.alert.updateMany({
      where: { id: alertId, providerId },
      data: { isRead: true },
    });
    if (result.count === 0) {
      throw new Error("Alert not found");
    }
    return { id: alertId };
  }

  /**
   * Mark all provider alerts as read
   */
  async markAllAlertsAsRead(providerId: string): Promise<{ count: number }> {
    const result = await prisma.alert.updateMany({
      where: {
        providerId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { count: result.count };
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(
    alertId: string,
    providerId: string
  ): Promise<{ id: string }> {
    const result = await prisma.alert.updateMany({
      where: { id: alertId, providerId },
      data: { isDismissed: true },
    });
    if (result.count === 0) {
      throw new Error("Alert not found");
    }
    return { id: alertId };
  }

  /**
   * Get unread alert count
   */
  async getUnreadCount(providerId: string): Promise<number> {
    // Counted from the same filtered alerts the list shows. A plain count also
    // included alerts with no linked appointment, and alerts whose appointment
    // had already been confirmed, so the badge disagreed with the list.
    const alerts = await this.getProviderAlerts(providerId, false);
    return alerts.length;
  }

  /**
   * Clean up expired alerts
   *
   * Marks expired alerts as dismissed
   */
  async cleanupExpiredAlerts(): Promise<{ count: number }> {
    const now = new Date();

    const result = await prisma.alert.updateMany({
      where: {
        expiresAt: {
          lt: now,
        },
        isDismissed: false,
      },
      data: {
        isDismissed: true,
      },
    });

    return { count: result.count };
  }

  /**
   * Generate all alerts for a provider
   *
   * Convenience method to generate both 24-hour and 1-hour alerts
   */
  async generateAllAlerts(providerId: string): Promise<{
    upcoming: Alert[];
    urgent: Alert[];
  }> {
    const upcoming = await this.generateUpcomingAppointmentAlerts(providerId);
    const urgent = await this.generateUrgentAppointmentAlerts(providerId);

    return { upcoming, urgent };
  }
}

// Singleton instance
export const alertService = new AlertService();
