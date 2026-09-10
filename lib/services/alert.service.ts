import { prisma } from "@/lib/prisma";
import type { Alert, AlertType, AlertPriority } from "@prisma/client";
import { addHours, subHours, isBefore, isAfter } from "date-fns";

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
          title: {
            contains: appointment.id,
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
            message: `Appointment scheduled for ${appointment.scheduledAt.toLocaleString()} is still REQUESTED. Confirm or follow up with patient. [ID: ${appointment.id}]`,
            expiresAt: appointment.scheduledAt,
          },
        });

        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Generate urgent alerts for appointments 1 hour away still in REQUESTED status
   */
  async generateUrgentAppointmentAlerts(
    providerId: string
  ): Promise<Alert[]> {
    const now = new Date();
    const oneHourFromNow = addHours(now, 1);
    const twoHoursFromNow = addHours(now, 2);

    // Find REQUESTED appointments within 1-2 hours
    const appointments = await prisma.appointment.findMany({
      where: {
        providerId,
        status: "REQUESTED",
        scheduledAt: {
          gte: oneHourFromNow,
          lte: twoHoursFromNow,
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
          title: {
            contains: appointment.id,
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
            message: `Appointment in 1 hour (${appointment.scheduledAt.toLocaleString()}) is STILL UNCONFIRMED! Take immediate action. [ID: ${appointment.id}]`,
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
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
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

    // Extract appointment IDs from messages
    const enrichedAlerts: AppointmentAlert[] = [];

    for (const alert of alerts) {
      // Extract appointment ID from message
      const match = alert.message.match(/\[ID: ([^\]]+)\]/);
      const appointmentId = match ? match[1] : null;

      if (appointmentId) {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
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

        if (appointment) {
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
    }

    return enrichedAlerts;
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(alertId: string): Promise<Alert> {
    return prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
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
  async dismissAlert(alertId: string): Promise<Alert> {
    return prisma.alert.update({
      where: { id: alertId },
      data: { isDismissed: true },
    });
  }

  /**
   * Get unread alert count
   */
  async getUnreadCount(providerId: string): Promise<number> {
    const now = new Date();

    return prisma.alert.count({
      where: {
        providerId,
        isRead: false,
        isDismissed: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
    });
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
