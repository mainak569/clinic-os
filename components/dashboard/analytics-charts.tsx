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
import { getDashboardAnalytics } from "@/app/actions/analytics.actions";

/**
 * Analytics Charts Component
 * 
 * Displays comprehensive analytics with Recharts:
 * - Appointments by provider (bar chart)
 * - Appointments by status (pie chart)
 * - No-show rate last 8 weeks (line chart)
 */

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "#E879F9",   // Softer purple for requested
  CONFIRMED: "#A855F7",   // Primary purple for confirmed
  CHECKED_IN: "#8B5CF6",  // Deeper purple for checked in
  COMPLETED: "#22C55E",   // Green for completed/success
  NO_SHOW: "#F87171",     // Red for no-show
  CANCELLED: "#94A3B8",   // Gray for cancelled/inactive
};

export function AnalyticsCharts() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const result = await getDashboardAnalytics();
      if (result.success) {
        setAnalytics(result.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              Loading analytics...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { summary } = analytics;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600">Total Appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#A855F7]">
              {summary.totalAppointments}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600">Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#22C55E]">
              {summary.completedAppointments}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600">No-Shows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#F87171]">
              {summary.noShowAppointments}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {summary.overallNoShowRate.toFixed(1)}% rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardDescription className="text-gray-600">Cancelled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#94A3B8]">
              {summary.cancelledAppointments}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Appointments by Provider */}
        {analytics.appointmentsByProvider && (
          <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-lg">
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
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#9ca3af"
                  />
                  <YAxis fontSize={12} stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
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
        )}

        {/* Appointments by Status */}
        <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-lg">
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
                  outerRadius={100}
                  label={(entry: any) => `${entry.status}: ${entry.count}`}
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
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(10px)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
                    {status.status}: {status.count} ({status.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No-Show Rate Trend */}
      <Card className="bg-white/70 backdrop-blur-xl border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            No-Show Rate - Last 8 Weeks
            {analytics.noShowRateLast8Weeks && (
              <>
                {analytics.noShowRateLast8Weeks[
                  analytics.noShowRateLast8Weeks.length - 1
                ]?.noShowRate >
                analytics.noShowRateLast8Weeks[0]?.noShowRate ? (
                  <TrendingUp className="h-4 w-4 text-[#F87171]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-[#22C55E]" />
                )}
              </>
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
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
                stroke="#9ca3af"
              />
              <YAxis
                fontSize={12}
                stroke="#9ca3af"
                label={{
                  value: "No-Show Rate (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: '#9ca3af' }
                }}
              />
              <Tooltip
                formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Legend />
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
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            {analytics.noShowRateLast8Weeks.map((week: any, index: number) => (
              <div
                key={index}
                className="rounded-xl bg-white/50 backdrop-blur-sm border-0 p-3 text-center shadow-sm"
              >
                <div className="font-medium text-gray-700">{week.week.split("of")[1]}</div>
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
    </div>
  );
}
