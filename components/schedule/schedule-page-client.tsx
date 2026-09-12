"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScheduleCalendar } from "@/components/schedule/schedule-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeading } from "@/components/layout/page-heading";
import { Clock } from "lucide-react";
import { Role } from "@prisma/client";

interface SchedulePageClientProps {
  providerId: string;
  providerName: string;
  allProviders: Array<{ id: string; firstName: string; lastName: string }>;
  userRole: Role;
}

export function SchedulePageClient({
  providerId,
  providerName,
  allProviders,
  userRole,
}: SchedulePageClientProps) {
  const router = useRouter();
  const [selectedProviderId, setSelectedProviderId] = useState(providerId);

  const handleProviderChange = (newProviderId: string) => {
    setSelectedProviderId(newProviderId);
    router.push(`/dashboard/schedule?provider=${newProviderId}`);
  };

  const selectedProvider = allProviders.find((p) => p.id === selectedProviderId);
  const selectedProviderName = selectedProvider
    ? `${selectedProvider.firstName} ${selectedProvider.lastName}`
    : providerName;

  return (
    <>
      <PageHeading
        icon={Clock}
        title="Schedule"
        description={`Managing availability for ${selectedProviderName}. Slots added here become bookable for patients.`}
        actions={
          <div className="w-full sm:w-auto">
            <Label
              htmlFor="provider-select"
              className="mb-1.5 block text-xs font-medium text-muted-foreground"
            >
              Provider
            </Label>
            <Select
              value={selectedProviderId}
              onValueChange={handleProviderChange}
            >
              <SelectTrigger id="provider-select" className="w-full sm:w-[15rem]">
                <SelectValue placeholder="Choose a provider" />
              </SelectTrigger>
              <SelectContent>
                {allProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.firstName} {provider.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      <ScheduleCalendar
        providerId={selectedProviderId}
        providerName={selectedProviderName}
        userRole={userRole}
      />
    </>
  );
}
