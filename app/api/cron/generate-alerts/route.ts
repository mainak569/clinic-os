import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { alertService } from "@/lib/services/alert.service";

/**
 * Cron Job: Generate Alerts
 * 
 * This endpoint should be called periodically (e.g., every 15 minutes) by a cron service.
 * It generates alerts for all providers with REQUESTED appointments.
 * 
 * Usage with Vercel Cron:
 * Add to vercel.json with schedule: every 15 minutes
 * 
 * Or call manually for testing:
 * curl http://localhost:3000/api/cron/generate-alerts
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Optional: Verify request is from cron service
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all active providers
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: { id: true, firstName: true, lastName: true },
    });

    let totalUpcoming = 0;
    let totalUrgent = 0;
    const results: Array<{ providerId: string; providerName: string; upcoming: number; urgent: number }> = [];

    // Generate alerts for each provider
    for (const provider of providers) {
      const { upcoming, urgent } = await alertService.generateAllAlerts(provider.id);

      totalUpcoming += upcoming.length;
      totalUrgent += urgent.length;

      if (upcoming.length > 0 || urgent.length > 0) {
        results.push({
          providerId: provider.id,
          providerName: `${provider.firstName} ${provider.lastName}`,
          upcoming: upcoming.length,
          urgent: urgent.length,
        });
      }
    }

    // Clean up expired alerts
    const cleanupResult = await alertService.cleanupExpiredAlerts();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providersProcessed: providers.length,
      alertsGenerated: {
        upcoming: totalUpcoming,
        urgent: totalUrgent,
        total: totalUpcoming + totalUrgent,
      },
      expiredAlertsCleaned: cleanupResult.count,
      details: results,
    });
  } catch (error) {
    console.error("Generate alerts cron error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate alerts",
      },
      { status: 500 }
    );
  }
}
