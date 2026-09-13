"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Sector,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieSectorShapeProps } from "recharts/types/polar/Pie";
import {
  CalendarCheck,
  CalendarDays,
  Minus,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserX,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardAnalytics } from "@/app/actions/analytics.actions";
import { getDashboardStats } from "@/app/actions/queries.actions";
import { STATUS_HEX, statusLabel } from "@/lib/appointment-status";

/**
 * Dashboard analytics
 *
 * - Stat tiles for today's numbers
 * - Appointments by provider: horizontal bars (front desk only)
 * - Appointments by status: donut with a counted legend
 * - No-show rate over the last 8 weeks: area chart with a week-over-week footer
 *
 * Styling follows the app's glass surfaces: brand purple for single-series
 * marks, hairline grids, text in gray ink (never in the series colour), glass
 * tooltips. Status colours come from lib/appointment-status.ts and were checked
 * for colour-blind separation in the donut's slice order below.
 */

interface ProviderCount {
  providerName: string;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

interface WeeklyNoShow {
  week: string;
  totalAppointments: number;
  noShows: number;
  noShowRate: number;
}

interface DashboardAnalytics {
  summary: { overallNoShowRate: number; confirmedAppointments: number };
  appointmentsByProvider?: ProviderCount[];
  appointmentsByStatus: StatusCount[];
  noShowRateLast8Weeks: WeeklyNoShow[];
}

interface DashboardStats {
  appointmentsToday: number;
  checkedInToday: number;
  noShowsThisWeek: number;
  upcomingAppointments: number;
}

const ACCENT = "#A855F7";
/** Card surface (white/80 over the lavender background): gaps and dot rings. */
const SURFACE = "#FBF8FF";
const GRID = "#EDE9FE";
const AXIS_TEXT = "#6B7280";

/**
 * Slice order for the donut. Neighbouring slices must stay distinguishable
 * with colour-blindness, so the three purple-family states are never adjacent.
 * Cancelled is a neutral gray and sits last.
 */
const DONUT_ORDER = ["CONFIRMED", "COMPLETED", "REQUESTED", "NO_SHOW", "CHECKED_IN", "CANCELLED"];

export function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    try {
      setError(null);
      const [result, statsResult] = await Promise.all([
        getDashboardAnalytics(),
        getDashboardStats(),
      ]);

      if (result.success) {
        setAnalytics(result.data as DashboardAnalytics);
      } else {
        setError(result.error || "Failed to load analytics");
      }
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="mb-4 h-10 w-10 rounded-2xl" />
                <Skeleton className="mb-2 h-8 w-16 rounded-xl" />
                <Skeleton className="h-4 w-28 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="mb-4 h-5 w-40 rounded-full" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="mb-4 font-medium text-red-600">{error}</p>
          <Button onClick={loadAnalytics}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) return null;

  const { summary } = analytics;
  // Providers don't get the cross-provider chart (front desk only).
  const showProviderChart = analytics.appointmentsByProvider !== undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={CalendarDays}
          label="Appointments today"
          value={stats?.appointmentsToday ?? 0}
          hint="Requested, confirmed or checked in"
        />
        <StatTile
          icon={UserCheck}
          label="Checked in today"
          value={stats?.checkedInToday ?? 0}
          hint="Including visits already completed"
        />
        <StatTile
          icon={CalendarCheck}
          label="Upcoming"
          value={stats?.upcomingAppointments ?? summary.confirmedAppointments}
          hint="Requested or confirmed, from now on"
        />
        <StatTile
          icon={UserX}
          tone="alert"
          label="No-shows this week"
          value={stats?.noShowsThisWeek ?? 0}
          hint={`${summary.overallNoShowRate.toFixed(1)}% no-show rate overall`}
        />
      </div>

      <div className={`grid gap-6 ${showProviderChart ? "lg:grid-cols-2" : ""}`}>
        {showProviderChart && (
          <ProviderChart data={analytics.appointmentsByProvider ?? []} />
        )}
        <StatusChart data={analytics.appointmentsByStatus ?? []} />
      </div>

      <NoShowTrendChart
        data={analytics.noShowRateLast8Weeks ?? []}
        overallRate={summary.overallNoShowRate}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Stat tile                                                                 */
/* ------------------------------------------------------------------------ */

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  hint: string;
  tone?: "brand" | "alert";
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 pt-6">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-950">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-500">{hint}</p>
        </div>
        <div
          className={
            tone === "alert"
              ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600"
              : "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700"
          }
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Shared pieces                                                             */
/* ------------------------------------------------------------------------ */

/** Glass tooltip: the value leads, the label follows, a short line keys the series. */
function GlassTooltip({
  color,
  value,
  label,
  detail,
}: {
  color: string;
  value: string;
  label: string;
  detail?: string;
}) {
  return (
    <div className="min-w-[140px] rounded-2xl border border-white/70 bg-white/90 px-3.5 py-2.5 shadow-xl shadow-purple-500/10 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <span className="text-base font-semibold text-gray-950">{value}</span>
      </div>
      <p className="mt-0.5 text-xs font-medium text-gray-600">{label}</p>
      {detail && <p className="mt-0.5 text-xs text-gray-500">{detail}</p>}
    </div>
  );
}

function EmptyChart({ title, description, message }: { title: string; description: string; message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">{title}</CardTitle>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-purple-200 bg-white/40">
          <p className="text-sm font-medium text-gray-500">{message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Appointments by provider                                                  */
/* ------------------------------------------------------------------------ */

function ProviderChart({ data }: { data: ProviderCount[] }) {
  const title = "Appointments by provider";
  const description = "All appointments booked with each provider";

  if (data.length === 0) {
    return <EmptyChart title={title} description={description} message="No appointments yet" />;
  }

  const rows = [...data].sort((a, b) => b.count - a.count);
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const max = Math.max(...rows.map((r) => r.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">{title}</CardTitle>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ height: Math.max(rows.length * 52 + 16, 140) }} aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 4, right: 40, bottom: 4, left: 0 }}
              barCategoryGap={12}
            >
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" hide domain={[0, Math.ceil(max * 1.1)]} />
              <YAxis
                type="category"
                dataKey="providerName"
                width={130}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#374151", fontSize: 13, fontWeight: 500 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(168, 85, 247, 0.06)", radius: 12 }}
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as ProviderCount | undefined;
                  if (!active || !row) return null;
                  return (
                    <GlassTooltip
                      color={ACCENT}
                      value={`${row.count} appointments`}
                      label={row.providerName}
                      detail={`${total > 0 ? ((row.count / total) * 100).toFixed(0) : 0}% of all bookings`}
                    />
                  );
                }}
              />
              <Bar dataKey="count" fill={ACCENT} radius={[0, 4, 4, 0]} barSize={20}>
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={10}
                  fill="#111827"
                  fontSize={13}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> appointments across{" "}
          {rows.length} {rows.length === 1 ? "provider" : "providers"}
        </p>
        <table className="sr-only">
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Provider</th>
              <th scope="col">Appointments</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.providerName}>
                <td>{r.providerName}</td>
                <td>{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* Appointments by status                                                    */
/* ------------------------------------------------------------------------ */

function StatusChart({ data }: { data: StatusCount[] }) {
  // Hovering or focusing a slice or a legend row shows that status in the hole.
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const title = "Appointments by status";
  const description = "Where every appointment currently stands";

  const slices = DONUT_ORDER.map((status) => data.find((d) => d.status === status))
    .concat(data.filter((d) => !DONUT_ORDER.includes(d.status)))
    .filter((d): d is StatusCount => !!d && d.count > 0);

  if (slices.length === 0) {
    return <EmptyChart title={title} description={description} message="No appointments yet" />;
  }

  const total = slices.reduce((sum, s) => sum + s.count, 0);
  const colorOf = (status: string) => STATUS_HEX[status] ?? "#94A3B8";
  const active = slices.find((s) => s.status === activeStatus) ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-gray-900">{title}</CardTitle>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,220px)_1fr]">
          <div className="relative mx-auto h-[220px] w-full max-w-[220px]" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={64}
                  outerRadius={92}
                  stroke={SURFACE}
                  strokeWidth={2}
                  startAngle={90}
                  endAngle={-270}
                  onMouseEnter={(_: unknown, index: number) => setActiveStatus(slices[index]?.status ?? null)}
                  onMouseLeave={() => setActiveStatus(null)}
                  shape={(props: PieSectorShapeProps) => {
                    const slice = props.payload as StatusCount;
                    const outer = Number(props.outerRadius ?? 0);
                    const isActive = slice.status === activeStatus;
                    return (
                      <Sector
                        {...props}
                        fill={colorOf(slice.status)}
                        outerRadius={isActive ? outer + 6 : outer}
                        opacity={activeStatus && !isActive ? 0.45 : 1}
                      />
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* The hole shows the total, or the hovered status. */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-semibold tracking-tight text-gray-950">
                {(active ? active.count : total).toLocaleString()}
              </span>
              <span className="text-xs font-medium text-gray-600">
                {active ? statusLabel(active.status) : "appointments"}
              </span>
              {active && (
                <span className="text-xs tabular-nums text-gray-500">
                  {active.percentage.toFixed(0)}% of total
                </span>
              )}
            </div>
          </div>

          <ul className="space-y-2">
            {slices.map((slice) => {
              const isActive = slice.status === activeStatus;
              return (
                <li
                  key={slice.status}
                  tabIndex={0}
                  onMouseEnter={() => setActiveStatus(slice.status)}
                  onMouseLeave={() => setActiveStatus(null)}
                  onFocus={() => setActiveStatus(slice.status)}
                  onBlur={() => setActiveStatus(null)}
                  className={`flex cursor-default items-center gap-3 rounded-2xl px-3 py-2 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#A855F7]/50 ${
                    isActive ? "bg-white shadow-sm" : "bg-white/50"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: colorOf(slice.status) }}
                    aria-hidden
                  />
                  <span className="flex-1 text-sm font-medium text-gray-700">
                    {statusLabel(slice.status)}
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-gray-950">{slice.count}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-gray-500">
                    {slice.percentage.toFixed(0)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------------ */
/* No-show rate trend                                                        */
/* ------------------------------------------------------------------------ */

function NoShowTrendChart({ data, overallRate }: { data: WeeklyNoShow[]; overallRate: number }) {
  const title = "No-show rate";
  const description = "Share of attended-or-missed visits that were no-shows, last 8 weeks";

  if (data.length === 0) {
    return <EmptyChart title={title} description={description} message="No completed visits yet" />;
  }

  const points = data.map((w) => ({ ...w, label: w.week.replace(/^Week of\s+/, "") }));
  const lastIndex = points.length - 1;
  const latest = points[lastIndex];
  const previous = points[lastIndex - 1];
  const change = previous ? latest.noShowRate - previous.noShowRate : 0;
  const peak = Math.max(...points.map((p) => p.noShowRate));
  const yMax = Math.max(10, Math.ceil(peak / 10) * 10);

  const Trend = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
  const trendText =
    change > 0
      ? `Up ${change.toFixed(1)} points on last week`
      : change < 0
        ? `Down ${Math.abs(change).toFixed(1)} points on last week`
        : "No change on last week";

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-gray-900">{title}</CardTitle>
        <CardDescription className="text-gray-600">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]" aria-hidden>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 28, right: 24, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="noShowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                padding={{ left: 16, right: 16 }}
                interval="preserveStartEnd"
                tick={{ fill: AXIS_TEXT, fontSize: 12 }}
              />
              <YAxis
                domain={[0, yMax]}
                allowDecimals={false}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                width={52}
                tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: AXIS_TEXT, fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: "#C4B5FD", strokeWidth: 1 }}
                content={({ active, payload }) => {
                  const week = payload?.[0]?.payload as (WeeklyNoShow & { label: string }) | undefined;
                  if (!active || !week) return null;
                  return (
                    <GlassTooltip
                      color={ACCENT}
                      value={`${week.noShowRate.toFixed(1)}%`}
                      label={`Week of ${week.label}`}
                      detail={
                        week.totalAppointments > 0
                          ? `${week.noShows} of ${week.totalAppointments} visits missed`
                          : "No completed or missed visits"
                      }
                    />
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="noShowRate"
                stroke={ACCENT}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="url(#noShowFill)"
                dot={{ r: 4, fill: ACCENT, stroke: SURFACE, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: ACCENT, stroke: SURFACE, strokeWidth: 2 }}
              >
                {/* Label only the latest week; the axis and tooltip carry the rest. */}
                <LabelList
                  dataKey="noShowRate"
                  content={({ x, y, value, index }) =>
                    index === lastIndex ? (
                      <text
                        x={Number(x)}
                        y={Number(y) - 14}
                        textAnchor="middle"
                        className="fill-gray-900 text-xs font-semibold"
                      >
                        {`${Number(value).toFixed(1)}%`}
                      </text>
                    ) : null
                  }
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-white/70 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-medium text-gray-800">
            <Trend
              className={`h-4 w-4 ${change > 0 ? "text-red-600" : change < 0 ? "text-green-600" : "text-gray-500"}`}
              aria-hidden
            />
            {trendText}
          </div>
          <p className="text-gray-600">
            Overall no-show rate{" "}
            <span className="font-semibold text-gray-900">{overallRate.toFixed(1)}%</span>
          </p>
        </div>

        <table className="sr-only">
          <caption>{title} by week</caption>
          <thead>
            <tr>
              <th scope="col">Week of</th>
              <th scope="col">Visits</th>
              <th scope="col">No-shows</th>
              <th scope="col">Rate</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.week}>
                <td>{p.label}</td>
                <td>{p.totalAppointments}</td>
                <td>{p.noShows}</td>
                <td>{p.noShowRate.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
