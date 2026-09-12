import Link from "next/link";
import { requireAuth } from "@/lib/auth-helpers";
import { PageHeading } from "@/components/layout/page-heading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import { SchedulePageClient } from "@/components/schedule/schedule-page-client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Schedule - ClinicOS",
  description: "Manage your availability schedule",
};

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const session = await requireAuth();
  const params = await searchParams;

  // Get provider ID based on role
  let providerId: string | null = null;
  let providerName: string | null = null;
  let allProviders: Array<{ id: string; firstName: string; lastName: string }> = [];

  if (session.user.role === "PROVIDER") {
    // Providers can only manage their own schedule
    providerId = session.user.providerId;
    if (!providerId) {
      redirect("/unauthorized");
    }
    providerName = session.user.providerName || session.user.email;
  } else if (session.user.role === "FRONT_DESK") {
    // Front desk can manage any provider's schedule
    // Only active providers can be booked, so only they get a schedule here.
    allProviders = await prisma.provider.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
      orderBy: { lastName: "asc" },
    });

    if (allProviders.length === 0) {
      return (
        <Alert className="border-amber-200 bg-amber-50/70">
          <AlertTriangle className="h-4 w-4 !text-amber-600" />
          <AlertTitle>No providers yet</AlertTitle>
          <AlertDescription className="text-amber-900/80">
            Availability belongs to a provider, so{" "}
            <Link href="/dashboard/providers" className="font-medium underline underline-offset-4">
              add a provider
            </Link>{" "}
            before setting up a schedule.
          </AlertDescription>
        </Alert>
      );
    }

    // Use query param if provided, otherwise default to first provider
    providerId = params.provider || allProviders[0].id;
    const selectedProvider = allProviders.find((p) => p.id === providerId);
    if (selectedProvider) {
      providerName = `${selectedProvider.firstName} ${selectedProvider.lastName}`;
    } else {
      // Invalid provider ID, default to first
      providerId = allProviders[0].id;
      providerName = `${allProviders[0].firstName} ${allProviders[0].lastName}`;
    }
  }

  if (!providerId) {
    redirect("/unauthorized");
  }

  // If front desk user, show provider selector
  if (session.user.role === "FRONT_DESK") {
    return (
      <SchedulePageClient
        providerId={providerId}
        providerName={providerName || "Provider"}
        allProviders={allProviders}
        userRole={session.user.role}
      />
    );
  }

  // Provider users see their own schedule directly
  return (
    <>
      <PageHeading
        icon={Clock}
        title="Schedule"
        description="Set the hours you're available. Slots you add here become bookable for patients."
      />

      <ScheduleCalendar
        providerId={providerId}
        providerName={providerName || "Provider"}
        userRole={session.user.role}
      />
    </>
  );
}
