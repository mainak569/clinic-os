/**
 * One appointment-status vocabulary for the whole app.
 *
 * Previously three files each defined their own colours: the tables showed
 * CONFIRMED as green while the charts used green for COMPLETED and purple for
 * CONFIRMED. The same appointment therefore changed colour depending on where
 * you looked at it. These are now the only status colours in the product.
 *
 * The hues follow the brand's purple family for the "in progress" states, and
 * break out of it only where a state genuinely means something else: green for
 * done, red for a missed visit, slate for cancelled.
 */

export type AppointmentStatusKey =
  | "REQUESTED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "COMPLETED"
  | "NO_SHOW"
  | "CANCELLED";

export interface StatusStyle {
  /** Human label, used in badges, filters and legends. */
  label: string;
  /** Tailwind classes for a soft badge on a glass surface. */
  badge: string;
  /** Solid hex for chart marks and dots — matches the badge hue. */
  hex: string;
  /** Tailwind text colour for icons and emphasis. */
  text: string;
}

export const APPOINTMENT_STATUS: Record<AppointmentStatusKey, StatusStyle> = {
  REQUESTED: {
    label: "Requested",
    badge: "bg-fuchsia-100/80 text-fuchsia-700 border-fuchsia-200",
    hex: "#E879F9",
    text: "text-fuchsia-600",
  },
  CONFIRMED: {
    label: "Confirmed",
    badge: "bg-purple-100/80 text-purple-700 border-purple-200",
    hex: "#A855F7",
    text: "text-purple-600",
  },
  CHECKED_IN: {
    label: "Checked In",
    badge: "bg-violet-100/80 text-violet-700 border-violet-200",
    hex: "#8B5CF6",
    text: "text-violet-600",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-green-100/80 text-green-700 border-green-200",
    hex: "#22C55E",
    text: "text-green-600",
  },
  NO_SHOW: {
    label: "No Show",
    badge: "bg-red-100/80 text-red-700 border-red-200",
    hex: "#F87171",
    text: "text-red-600",
  },
  CANCELLED: {
    label: "Cancelled",
    badge: "bg-slate-100/80 text-slate-600 border-slate-200",
    hex: "#94A3B8",
    text: "text-slate-500",
  },
};

export const STATUS_ORDER: AppointmentStatusKey[] = [
  "REQUESTED",
  "CONFIRMED",
  "CHECKED_IN",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
];

const FALLBACK: StatusStyle = {
  label: "Unknown",
  badge: "bg-slate-100/80 text-slate-600 border-slate-200",
  hex: "#94A3B8",
  text: "text-slate-500",
};

export function statusStyle(status: string): StatusStyle {
  return (
    APPOINTMENT_STATUS[status as AppointmentStatusKey] ?? {
      ...FALLBACK,
      label: status.replace(/_/g, " "),
    }
  );
}

/** Convenience helpers so call sites don't reach into the object directly. */
export const statusLabel = (status: string) => statusStyle(status).label;
export const statusBadge = (status: string) => statusStyle(status).badge;
export const statusHex = (status: string) => statusStyle(status).hex;

/** Chart-friendly map: { REQUESTED: "#E879F9", ... } */
export const STATUS_HEX: Record<string, string> = Object.fromEntries(
  STATUS_ORDER.map((k) => [k, APPOINTMENT_STATUS[k].hex])
);
