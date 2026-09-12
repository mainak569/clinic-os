import { requireAuth } from "@/lib/auth-helpers";
import { AppointmentsTable } from "@/components/appointments/appointments-table";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";
import { Calendar } from "lucide-react";

export const metadata = {
  title: "Appointments - ClinicOS",
  description: "Manage appointments",
};

export default async function AppointmentsPage() {
  const session = await requireAuth();

  return (
    <>
      <PageHeading
        icon={Calendar}
        title="Appointments"
        description={
          session.user.role === "PROVIDER"
            ? "View, search and manage the appointments booked with you."
            : "View, search and manage appointments across every provider."
        }
      />

      <Card>
        <CardContent className="pt-6">
          <AppointmentsTable
            userRole={session.user.role}
            providerId={session.user.providerId || undefined}
          />
        </CardContent>
      </Card>
    </>
  );
}
