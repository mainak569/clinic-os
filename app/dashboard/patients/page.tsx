import { requireAuth } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { PatientsTable } from "@/components/patients/patients-table";
import { PageHeading } from "@/components/layout/page-heading";
import { Users } from "lucide-react";

export const metadata = {
  title: "Patients - ClinicOS",
  description: "Manage patient records",
};

export default async function PatientsPage() {
  const session = await requireAuth();

  return (
    <>
      <PageHeading
        icon={Users}
        title="Patients"
        description={
          session.user.role === "FRONT_DESK"
            ? "Search, view and manage patient records and contact details."
            : "Patient records for the people you have appointments with."
        }
      />

      <Card>
        <CardContent className="pt-6">
          <PatientsTable userRole={session.user.role} />
        </CardContent>
      </Card>
    </>
  );
}
