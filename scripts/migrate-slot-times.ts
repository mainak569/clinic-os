/**
 * One-off data migration: bring every availability slot onto the canonical
 * time encoding (wall-clock time on 1970-01-01 in the UTC fields).
 *
 * The table held two encodings at once:
 *   - Seeded rows (date part 2024-01-01) already kept wall time in the UTC
 *     fields: 2024-01-01T09:00Z meant 9:00 AM. Only the date part changes.
 *   - Rows created through the UI stored the browser's local instant, e.g.
 *     2026-09-12T03:30Z for 9:00 AM in Asia/Kolkata. Their wall time is
 *     recovered by reading the instant in the clinic timezone.
 *
 * Usage:
 *   npx tsx scripts/migrate-slot-times.ts            # dry run, prints the plan
 *   npx tsx scripts/migrate-slot-times.ts --apply    # writes, in one transaction
 *
 * Safe to re-run: rows already on 1970-01-01 are left alone.
 */
import { PrismaClient } from "@prisma/client";
import { CLINIC_TIME_ZONE, clinicWallClock } from "../lib/clinic-time";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const SEED_DATE = "2024-01-01";
const CANONICAL_DATE = "1970-01-01";

function canonical(minutes: number): Date {
  return new Date(Date.UTC(1970, 0, 1, Math.floor(minutes / 60), minutes % 60));
}

function wallMinutes(value: Date): number {
  const datePart = value.toISOString().slice(0, 10);
  if (datePart === CANONICAL_DATE || datePart === SEED_DATE) {
    return value.getUTCHours() * 60 + value.getUTCMinutes();
  }
  return clinicWallClock(value).minutes;
}

function hhmm(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

async function main() {
  const slots = await prisma.availabilitySlot.findMany({ orderBy: { createdAt: "asc" } });

  const plan = slots.map((slot) => {
    const start = wallMinutes(slot.startTime);
    const end = wallMinutes(slot.endTime);
    const alreadyCanonical =
      slot.startTime.toISOString().startsWith(CANONICAL_DATE) &&
      slot.endTime.toISOString().startsWith(CANONICAL_DATE);
    return { slot, start, end, alreadyCanonical };
  });

  console.log(`Clinic timezone: ${CLINIC_TIME_ZONE}`);
  console.log(`Mode: ${apply ? "APPLY" : "dry run"}\n`);
  for (const { slot, start, end, alreadyCanonical } of plan) {
    console.log(
      `${slot.id}  ${slot.dayOfWeek.padEnd(9)}  ${slot.startTime.toISOString()} -> ${slot.endTime.toISOString()}` +
        `   =>   ${hhmm(start)}-${hhmm(end)}${alreadyCanonical ? "  (already canonical)" : ""}`
    );
  }

  // Refuse to write anything inconsistent.
  const invalid = plan.filter((p) => p.end <= p.start);
  if (invalid.length) {
    throw new Error(`Refusing to migrate: ${invalid.length} slot(s) would end before they start.`);
  }
  const keys = new Map<string, string>();
  for (const p of plan) {
    const key = `${p.slot.providerId}|${p.slot.dayOfWeek}|${p.start}|${p.end}`;
    if (keys.has(key)) {
      throw new Error(
        `Refusing to migrate: slots ${keys.get(key)} and ${p.slot.id} would become identical and break the unique index.`
      );
    }
    keys.set(key, p.slot.id);
  }

  const pending = plan.filter((p) => !p.alreadyCanonical);
  console.log(`\n${pending.length} of ${plan.length} slot(s) need migrating.`);

  if (!apply || pending.length === 0) {
    if (!apply) console.log("Dry run only. Re-run with --apply to write.");
    return;
  }

  await prisma.$transaction(
    pending.map((p) =>
      prisma.availabilitySlot.update({
        where: { id: p.slot.id },
        data: { startTime: canonical(p.start), endTime: canonical(p.end) },
      })
    )
  );
  console.log(`Migrated ${pending.length} slot(s).`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
