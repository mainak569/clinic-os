import { Stethoscope } from "lucide-react";

import { requireRole } from "@/lib/auth-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/layout/page-heading";
import { ProvidersTable } from "@/components/provider-management/providers-table";

export const metadata = {
  title: "Providers - ClinicOS",
  description: "Manage providers",
};

export default async function ProvidersPage() {
  await requireRole("FRONT_DESK");

  return (
    <>
      <PageHeading
        icon={Stethoscope}
        title="Providers"
        description="Add clinicians, manage their sign-in and profile, and deactivate providers who no longer see patients."
      />

      <Card>
        <CardContent className="pt-6">
          <ProvidersTable />
        </CardContent>
      </Card>
    </>
  );
}
