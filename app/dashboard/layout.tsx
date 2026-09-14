import { requireAuth } from "@/lib/auth-helpers";
import { MoltenBackground } from "@/components/layout/molten-background";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

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
      <MoltenBackground />
      <DashboardHeader
        email={session.user.email ?? ""}
        role={session.user.role}
        providerName={session.user.providerName}
      />
      <main className="container mx-auto space-y-8 px-4 py-8">{children}</main>
      <AssistantWidget role={session.user.role} />
    </div>
  );
}
