"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardAnalytics } from "@/app/actions/analytics.actions";
import { getDashboardStats } from "@/app/actions/queries.actions";
import { STATUS_HEX, statusLabel } from "@/lib/appointment-status";

/**
 * Analytics Charts Component
 *
 * Displays comprehensive analytics with Recharts:
 * - Appointments by provider (bar chart)
 * - Appointments by status (pie chart)
 * - No-show rate last 8 weeks (line chart)
 */

const STATUS_COLORS = STATUS_HEX;

export function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [stats, setStats] = useState<{
    appointmentsToday: number;
    checkedInToday: number;
    noShowsThisWeek: number;
    upcomingAppointments: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setError(null);
      // The summary tiles used to be guessed from the all-time total
      // (totalAppointments * 0.05). They now come from getDashboardStats,
      // which counts today's appointments for real.
      const [result, statsResult] = await Promise.all([
        getDashboardAnalytics(),
        getDashboardStats(),
      ]);

      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error || "Failed to load analytics");
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading Skeletons */}
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="mb-3 h-4 w-24 rounded-full" />
                <Skeleton className="h-9 w-16 rounded-xl" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="mb-4 h-4 w-32 rounded-full" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <Button onClick={loadAnalytics}>Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return null;
  }

  const { summary } = analytics;

  // Real counts from the database, not estimates.
  const appointmentsToday = stats?.appointmentsToday ?? 0;
  const checkedInToday = stats?.checkedInToday ?? 0;
  const upcomingConfirmed = stats?.upcomingAppointments ?? summary.confirmedAppointments;
  const noShowsThisWeek = stats?.noShowsThisWeek ?? 0;

  return (
    <div className="space-y-6">
      {/* Improved Summary Cards - More Actionable Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-purple-50 to-white/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 font-medium">
              Appointments Today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#A855F7]">
              {appointmentsToday}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 font-medium">
              Checked In
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#22C55E]">
              {checkedInToday}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Patients checked in today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 font-medium">
              Upcoming Confirmed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#3B82F6]">
              {upcomingConfirmed}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Confirmed appointments
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-white/80">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600 font-medium">
              No-Shows This Week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#F87171]">
              {noShowsThisWeek}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.overallNoShowRate.toFixed(1)}% overall rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Appointments by Provider */}
        {analytics.appointmentsByProvider && analytics.appointmentsByProvider.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Appointments by Provider</CardTitle>
              <CardDescription className="text-gray-600">
                Total appointments per provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.appointmentsByProvider}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="providerName"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    stroke="#9ca3af"
                    interval={0}
                  />
                  <YAxis fontSize={12} stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.25)'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar
                    dataKey="count"
                    fill="#A855F7"
                    name="Appointments"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Appointments by Provider</CardTitle>
              <CardDescription className="text-gray-600">
                Total appointments per provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="font-medium">No appointment data</p>
                  <p className="text-sm mt-1">Create appointments to see provider statistics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appointments by Status */}
        {analytics.appointmentsByStatus && analytics.appointmentsByStatus.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Appointments by Status</CardTitle>
              <CardDescription className="text-gray-600">Distribution of appointment statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.appointmentsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={(entry: any) =>
                      entry.count > 0
                        ? `${statusLabel(entry.status)}: ${entry.count}`
                        : ""
                    }
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    {analytics.appointmentsByStatus.map(
                      (entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || "#d1d5db"}
                          opacity={0.9}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '16px',
                      boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.25)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                {analytics.appointmentsByStatus.map((status: any) => (
                  <div key={status.status} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full shadow-sm"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[status.status] || "#d1d5db",
                      }}
                    />
                    <span className="text-gray-600">
                      {statusLabel(status.status)}: {status.count} (
                      {status.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Appointments by Status</CardTitle>
              <CardDescription className="text-gray-600">Distribution of appointment statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="font-medium">No status data</p>
                  <p className="text-sm mt-1">Appointment statuses will appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* No-Show Rate Trend */}
      {analytics.noShowRateLast8Weeks && analytics.noShowRateLast8Weeks.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              No-Show Rate - Last 8 Weeks
              {analytics.noShowRateLast8Weeks[
                analytics.noShowRateLast8Weeks.length - 1
              ]?.noShowRate >
              analytics.noShowRateLast8Weeks[0]?.noShowRate ? (
                <TrendingUp className="h-4 w-4 text-[#F87171]" />
              ) : (
                <TrendingDown className="h-4 w-4 text-[#22C55E]" />
              )}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Weekly no-show rate trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.noShowRateLast8Weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                <XAxis
                  dataKey="week"
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="#9ca3af"
                />
                <YAxis
                  fontSize={12}
                  stroke="#9ca3af"
                  label={{
                    value: "Rate (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: '#9ca3af', fontSize: 12 }
                  }}
                />
                <Tooltip
                  formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px -5px rgba(168, 85, 247, 0.25)'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="noShowRate"
                  stroke="#F87171"
                  strokeWidth={3}
                  name="No-Show Rate"
                  dot={{ fill: "#F87171", r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, fill: "#F87171" }}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Weekly Details */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {analytics.noShowRateLast8Weeks.map((week: any, index: number) => (
                <div
                  key={index}
                  className="rounded-2xl bg-white/50 backdrop-blur-sm p-3 text-center shadow-sm"
                >
                  <div className="font-medium text-gray-700 truncate">{week.week.split("of")[1]}</div>
                  <div className="text-gray-500">
                    {week.totalAppointments} appts
                  </div>
                  <div
                    className={`font-semibold ${
                      week.noShowRate > 10
                        ? "text-[#F87171]"
                        : week.noShowRate > 5
                          ? "text-[#FB923C]"
                          : "text-[#22C55E]"
                    }`}
                  >
                    {week.noShowRate.toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-800">No-Show Rate - Last 8 Weeks</CardTitle>
            <CardDescription className="text-gray-600">
              Weekly no-show rate trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <p className="font-medium">No trend data</p>
                <p className="text-sm mt-1">No-show trends will appear after 8 weeks of data</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
