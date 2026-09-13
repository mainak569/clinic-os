import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { alertService } from "@/lib/services/alert.service";

/**
 * Cron Job: Generate Alerts
 *
 * Called once a day by the Vercel cron in vercel.json (the Hobby plan limit).
 * For every active provider it creates alerts for REQUESTED appointments in
 * the next 24 hours, and urgent alerts for those starting in 1–2 hours, then
 * removes expired alerts.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set.
 * In production the secret is required; without it every request is refused.
 * Locally it can be left unset and the endpoint called directly:
 *   curl http://localhost:3000/api/cron/generate-alerts
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    console.error("Generate alerts cron: CRON_SECRET is not set; refusing request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const providers = await prisma.provider.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    let totalUpcoming = 0;
    let totalUrgent = 0;

    for (const provider of providers) {
      const { upcoming, urgent } = await alertService.generateAllAlerts(provider.id);
      totalUpcoming += upcoming.length;
      totalUrgent += urgent.length;
    }

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
    });
  } catch (error) {
    console.error("Generate alerts cron error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate alerts" },
      { status: 500 }
    );
  }
}
