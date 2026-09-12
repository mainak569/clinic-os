"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, List, Plus, Download, Archive, ArchiveRestore } from "lucide-react";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { ListView } from "./list-view";
import { CreateAvailabilityDialog } from "./create-availability-dialog";
import { EditAvailabilityDialog } from "./edit-availability-dialog";
import { BulkAvailabilityForm } from "@/components/availability/bulk-availability-form";
import { ScheduleExport } from "@/components/availability/schedule-export";
import { getProviderAvailability } from "@/app/actions/availability.actions";
import { Role } from "@prisma/client";
import { toast } from "sonner";

interface ScheduleCalendarProps {
  providerId: string;
  providerName: string;
  userRole: Role;
}

export type AvailabilitySlot = {
  id: string;
  providerId: string;
  dayOfWeek: string;
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export function ScheduleCalendar({
  providerId,
  providerName,
  userRole: _userRole,
}: ScheduleCalendarProps) {
  const [view, setView] = useState<"week" | "month" | "list">("week");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const loadAvailability = async () => {
    setIsLoading(true);
    try {
      const result = await getProviderAvailability(providerId, showInactive);
      if (result.success) {
        setSlots(result.data as AvailabilitySlot[]);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Failed to load availability:", error);
      toast.error("Failed to load availability");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerId, showInactive]);

  const handleSlotCreated = () => {
    setShowCreateDialog(false);
    loadAvailability();
  };

  const handleSlotUpdated = () => {
    setEditingSlot(null);
    loadAvailability();
  };

  const handleSlotClick = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
  };

  const activeSlots = slots.filter((s) => s.isActive);
  const archivedSlots = slots.filter((s) => !s.isActive);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Availability Schedule</CardTitle>
              <CardDescription>
                {activeSlots.length} active slots
                {archivedSlots.length > 0 && `, ${archivedSlots.length} archived`}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Slot
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkForm(!showBulkForm)}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                Bulk Create
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExport(!showExport)}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                variant={showInactive ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    Hide Archived
                  </>
                ) : (
                  <>
                    <ArchiveRestore className="mr-2 h-4 w-4" />
                    Show Archived
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Bulk Create Form */}
      {showBulkForm && (
        <BulkAvailabilityForm
          providerId={providerId}
          providerName={providerName}
        />
      )}

      {/* Export Form */}
      {showExport && (
        <ScheduleExport providerId={providerId} providerName={providerName} />
      )}

      {/* Calendar Views */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="week">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Week
              </TabsTrigger>
              <TabsTrigger value="month">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Month
              </TabsTrigger>
              <TabsTrigger value="list">
                <List className="mr-2 h-4 w-4" />
                List
              </TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="mt-6">
              <WeekView
                slots={slots}
                onSlotClick={handleSlotClick}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="month" className="mt-6">
              <MonthView
                slots={slots}
                onSlotClick={handleSlotClick}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <ListView
                slots={slots}
                onSlotClick={handleSlotClick}
                isLoading={isLoading}
                onRefresh={loadAvailability}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateAvailabilityDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        providerId={providerId}
        onSuccess={handleSlotCreated}
      />

      {editingSlot && (
        <EditAvailabilityDialog
          open={!!editingSlot}
          onOpenChange={(open) => !open && setEditingSlot(null)}
          slot={editingSlot}
          onSuccess={handleSlotUpdated}
        />
      )}
    </div>
  );
}
