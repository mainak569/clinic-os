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
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

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
  REQUESTED: "#f59e0b",
  CONFIRMED: "#3b82f6",
  CHECKED_IN: "#8b5cf6",
  COMPLETED: "#10b981",
  NO_SHOW: "#ef4444",
  CANCELLED: "#6b7280",
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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Appointments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary.completedAppointments}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>No-Shows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.noShowAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.overallNoShowRate.toFixed(1)}% rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cancelled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {summary.cancelledAppointments}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Appointments by Provider */}
        {analytics.appointmentsByProvider && (
          <Card>
            <CardHeader>
              <CardTitle>Appointments by Provider</CardTitle>
              <CardDescription>
                Total appointments per provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.appointmentsByProvider}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="providerName"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    fill="#3b82f6"
                    name="Appointments"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Appointments by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
            <CardDescription>Distribution of appointment statuses</CardDescription>
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
                  label={(entry) => `${entry.status}: ${entry.count}`}
                >
                  {analytics.appointmentsByStatus.map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.status] || "#6b7280"}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {analytics.appointmentsByStatus.map((status: any) => (
                <div key={status.status} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded"
                    style={{
                      backgroundColor:
                        STATUS_COLORS[status.status] || "#6b7280",
                    }}
                  />
                  <span>
                    {status.status}: {status.count} ({status.percentage.toFixed(1)}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* No-Show Rate Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            No-Show Rate - Last 8 Weeks
            {analytics.noShowRateLast8Weeks && (
              <>
                {analytics.noShowRateLast8Weeks[
                  analytics.noShowRateLast8Weeks.length - 1
                ]?.noShowRate >
                analytics.noShowRateLast8Weeks[0]?.noShowRate ? (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                )}
              </>
            )}
          </CardTitle>
          <CardDescription>
            Weekly no-show rate trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.noShowRateLast8Weeks}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                fontSize={12}
                label={{
                  value: "No-Show Rate (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="noShowRate"
                stroke="#ef4444"
                strokeWidth={2}
                name="No-Show Rate"
                dot={{ fill: "#ef4444", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Weekly Details */}
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
            {analytics.noShowRateLast8Weeks.map((week: any, index: number) => (
              <div
                key={index}
                className="rounded border p-2 text-center"
              >
                <div className="font-medium">{week.week.split("of")[1]}</div>
                <div className="text-muted-foreground">
                  {week.totalAppointments} appts
                </div>
                <div
                  className={`font-semibold ${
                    week.noShowRate > 10
                      ? "text-red-600"
                      : week.noShowRate > 5
                        ? "text-orange-600"
                        : "text-green-600"
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
