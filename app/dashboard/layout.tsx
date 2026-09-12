import { requireAuth } from "@/lib/auth-helpers";
import { GlassBackground } from "@/components/layout/glass-background";
import { DashboardHeader } from "@/components/layout/dashboard-header";

/**
 * Shared shell for every dashboard route.
 *
 * This is what gives Appointments, Patients and Schedule the same background
 * and navigation the dashboard already had.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return (
    <div className="relative min-h-screen">
      <GlassBackground />
      <DashboardHeader
        email={session.user.email ?? ""}
        role={session.user.role}
        providerName={session.user.providerName}
      />
      <main className="container mx-auto px-4 py-8 space-y-8">{children}</main>
    </div>
  );
}
