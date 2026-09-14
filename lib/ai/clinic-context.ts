import "server-only";

import { prisma } from "@/lib/prisma";
import {
  CLINIC_TIME_ZONE,
  endOfClinicDay,
  startOfClinicDay,
} from "@/lib/clinic-time";
import { statusLabel } from "@/lib/appointment-status";
import type { AssistantRole } from "./system-prompt";

/**
 * Read-only clinic data the assistant may use, built server-side.
 *
 * The model never queries the database. This module runs a fixed, role-scoped
 * query and passes the result as text: a provider only sees their own
 * appointments, front desk sees the whole clinic.
 *
 * No patient names, contact details, reasons for visit or clinical notes are
 * included, because this text is sent to a third-party model. The Appointments
 * page shows those details to users who are allowed to see them.
 */

export interface AssistantUser {
  role: AssistantRole;
  providerId: string | null;
}

const MAX_APPOINTMENTS = 50;

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CLINIC_TIME_ZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function typeLabel(type: string): string {
  const words = type.toLowerCase().split("_");
  return words
    .map((w, i) => (i === 0 ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export async function buildClinicContext(
  user: AssistantUser,
  now = new Date()
): Promise<string> {
  if (user.role === "PROVIDER" && !user.providerId) {
    return "No clinic data is available for this account.";
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      scheduledAt: { gte: startOfClinicDay(now), lte: endOfClinicDay(now) },
      ...(user.role === "PROVIDER" ? { providerId: user.providerId! } : {}),
    },
    select: {
      scheduledAt: true,
      duration: true,
      status: true,
      type: true,
      provider: { select: { title: true, firstName: true, lastName: true } },
    },
    orderBy: { scheduledAt: "asc" },
    take: MAX_APPOINTMENTS,
  });

  const scope =
    user.role === "PROVIDER"
      ? "this provider's own appointments only"
      : "all providers";
  const lines = [
    `Today: ${dayFormatter.format(now)} (clinic timezone ${CLINIC_TIME_ZONE}). Scope: ${scope}.`,
  ];

  if (appointments.length === 0) {
    lines.push("There are no appointments scheduled today.");
    return lines.join("\n");
  }

  const counts = new Map<string, number>();
  for (const appointment of appointments) {
    const label = statusLabel(appointment.status);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const breakdown = [...counts]
    .map(([label, count]) => `${label} ${count}`)
    .join(", ");
  const capped =
    appointments.length === MAX_APPOINTMENTS
      ? ` (showing the first ${MAX_APPOINTMENTS})`
      : "";

  lines.push(
    `Appointments today: ${appointments.length}${capped}. By status: ${breakdown}.`
  );
  lines.push("Schedule (start–end, status, type):");

  for (const appointment of appointments) {
    const start = new Date(appointment.scheduledAt);
    const end = new Date(start.getTime() + appointment.duration * 60_000);
    const provider =
      user.role === "FRONT_DESK" && appointment.provider
        ? `, ${[
            appointment.provider.title,
            appointment.provider.firstName,
            appointment.provider.lastName,
          ]
            .filter(Boolean)
            .join(" ")}`
        : "";
    lines.push(
      `- ${timeFormatter.format(start)}–${timeFormatter.format(end)}, ${statusLabel(appointment.status)}, ${typeLabel(appointment.type)}${provider}`
    );
  }

  return lines.join("\n");
}
