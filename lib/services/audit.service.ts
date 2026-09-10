import { prisma } from "@/lib/prisma";
import type { AuditAction, ResourceType, AuditLog } from "@prisma/client";

/**
 * HIPAA Audit Logging Service
 * 
 * Logs all access to Protected Health Information (PHI)
 * Required for HIPAA compliance
 * 
 * Retention: 7 years minimum (HIPAA requirement)
 */

export interface AuditLogInput {
  userId: string;
  action: AuditAction;
  resource: ResourceType;
  resourceId: string;
  details?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  /**
   * Log an action for HIPAA compliance
   * 
   * IMPORTANT: This should NEVER fail the main operation
   * If audit logging fails, log error but continue
   */
  async log(input: AuditLogInput): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: input.userId,
          action: input.action,
          resource: input.resource,
          resourceId: input.resourceId,
          details: input.details ? JSON.stringify(input.details) : null,
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
        },
      });
    } catch (error) {
      // CRITICAL: Audit logging failure should not break the app
      // But we must log it for investigation
      console.error("[AUDIT] Failed to create audit log:", error);
      console.error("[AUDIT] Attempted to log:", {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
      });
      
      // In production, this should alert operations team
      // Consider sending to error tracking service
    }
  }

  /**
   * Get audit trail for a specific resource
   * 
   * Used for:
   * - HIPAA compliance audits
   * - Security investigations
   * - Breach notifications
   */
  async getAuditTrail(
    resourceType: ResourceType,
    resourceId: string
  ): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: {
        resource: resourceType,
        resourceId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  }

  /**
   * Get user's activity log
   * 
   * Used for:
   * - User activity tracking
   * - Security investigations
   */
  async getUserActivity(
    userId: string,
    limit = 100
  ): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Search audit logs
   * 
   * Used for compliance audits and investigations
   */
  async searchLogs(params: {
    userId?: string;
    action?: AuditAction;
    resource?: ResourceType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const { userId, action, resource, startDate, endDate, limit = 1000 } = params;

    return prisma.auditLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(action && { action }),
        ...(resource && { resource }),
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Get audit summary statistics
   * 
   * Used for compliance reporting
   */
  async getAuditSummary(startDate: Date, endDate: Date) {
    const [totalLogs, byAction, byResource, byUser] = await Promise.all([
      prisma.auditLog.count({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.auditLog.groupBy({
        by: ["action"],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ["resource"],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ["userId"],
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: true,
      }),
    ]);

    return {
      totalLogs,
      byAction,
      byResource,
      topUsers: byUser.slice(0, 10),
    };
  }
}

// Singleton instance
export const auditService = new AuditService();
