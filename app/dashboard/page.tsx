import { requireAuth } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { signOut } from "@/auth";
import { Heart, LogOut, User } from "lucide-react";
import Link from "next/link";
import { AlertPanel } from "@/components/dashboard/alert-panel";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";

export const metadata = {
  title: "Dashboard - ClinicOS",
  description: "Your ClinicOS dashboard",
};

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ClinicOS</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{session.user.email}</p>
                <p className="text-muted-foreground">
                  {session.user.role.replace("_", " ")}
                </p>
              </div>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Welcome Back!</h1>
          <p className="text-muted-foreground">
            {session.user.providerName
              ? `${session.user.providerName}`
              : session.user.email}
          </p>
        </div>

        {/* Alerts - Only for Providers */}
        {session.user.role === "PROVIDER" && session.user.providerId && (
          <AlertPanel />
        )}

        {/* Analytics Dashboard */}
        <AnalyticsCharts />

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-semibold">Appointments</h3>
            <p className="text-sm text-muted-foreground">
              View and manage appointments
            </p>
            <Button className="mt-4 w-full" disabled>
              Coming Soon
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-semibold">Patients</h3>
            <p className="text-sm text-muted-foreground">
              Access patient records
            </p>
            <Button className="mt-4 w-full" disabled>
              Coming Soon
            </Button>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 font-semibold">Schedule</h3>
            <p className="text-sm text-muted-foreground">
              Manage your availability
            </p>
            <Button className="mt-4 w-full" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
