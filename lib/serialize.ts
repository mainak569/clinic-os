/**
 * Prisma returns Decimal columns (appointment cost, visit-note vitals) as
 * Decimal class instances. Those can't cross from a server action into a
 * client component, so every record carrying one is flattened to plain
 * numbers here before it leaves the server.
 */

export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof (value as { toNumber?: unknown }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

type Row = Record<string, any>;

export function serializeVisitNote<T extends Row | null | undefined>(note: T): T {
  if (!note) return note;
  return {
    ...note,
    temperature: toNumber(note.temperature),
    weight: toNumber(note.weight),
    height: toNumber(note.height),
  } as T;
}

export function serializeAppointment<T extends Row | null | undefined>(appointment: T): T {
  if (!appointment) return appointment;
  return {
    ...appointment,
    cost: toNumber(appointment.cost),
    ...(appointment.visitNote !== undefined && {
      visitNote: serializeVisitNote(appointment.visitNote),
    }),
  } as T;
}
