import { requireAuth } from "@/lib/auth-helpers";
import { Calendar, Clock as ClockIcon, Users, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { PageHeading } from "@/components/layout/page-heading";

export const metadata = {
  title: "Dashboard - ClinicOS",
  description: "Your ClinicOS dashboard",
};

const QUICK_ACTIONS = [
  {
    href: "/dashboard/appointments",
    title: "New Appointment",
    description: "Schedule a visit",
    icon: Calendar,
    color: "#A855F7",
    tint: "from-purple-50",
    hoverText: "group-hover:text-[#A855F7]",
  },
  {
    href: "/dashboard/appointments",
    title: "View Appointments",
    description: "Manage schedule",
    icon: Calendar,
    color: "#3B82F6",
    tint: "from-blue-50",
    hoverText: "group-hover:text-[#3B82F6]",
  },
  {
    href: "/dashboard/schedule",
    title: "Manage Schedule",
    description: "Set availability",
    icon: ClockIcon,
    color: "#22C55E",
    tint: "from-green-50",
    hoverText: "group-hover:text-[#22C55E]",
  },
  {
    href: "/dashboard/patients",
    title: "View Patients",
    description: "Patient records",
    icon: Users,
    color: "#F59E0B",
    tint: "from-amber-50",
    hoverText: "group-hover:text-[#F59E0B]",
  },
];

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <>
      <PageHeading
        icon={LayoutDashboard}
        title="Welcome Back!"
        description={
          session.user.providerName
            ? `Dr. ${session.user.providerName} — here's what's happening at your practice today.`
            : `${session.user.email} — here's what's happening at the clinic today.`
        }
      />

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className={`group rounded-2xl bg-gradient-to-br ${action.tint} to-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50`}
          >
            <div className="flex items-center gap-4">
              <div
                className="rounded-full p-3 shadow-md transition-transform group-hover:scale-110"
                style={{ backgroundColor: action.color }}
              >
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h3
                  className={`font-semibold text-gray-800 transition-colors ${action.hoverText}`}
                >
                  {action.title}
                </h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alerts - Only for Providers */}
      {session.user.role === "PROVIDER" && session.user.providerId && (
        <AlertPanel />
      )}

      {/* Analytics Dashboard */}
      <AnalyticsCharts />
    </>
  );
}
