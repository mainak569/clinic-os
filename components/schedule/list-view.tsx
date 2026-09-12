"use client";

import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AvailabilitySlot } from "./schedule-calendar";

interface ListViewProps {
  slots: AvailabilitySlot[];
  onSlotClick: (slot: AvailabilitySlot) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

const DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export function ListView({
  slots,
  onSlotClick,
  isLoading,
  onRefresh: _onRefresh,
}: ListViewProps) {
  const sortedSlots = [...slots].sort((a, b) => {
    // Sort by day of week first
    const dayA = DAY_ORDER.indexOf(a.dayOfWeek);
    const dayB = DAY_ORDER.indexOf(b.dayOfWeek);
    if (dayA !== dayB) return dayA - dayB;

    // Then by start time
    return (
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  if (sortedSlots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/70 bg-white/30 p-12">
        <CalendarIcon className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No Availability Slots</h3>
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Get started by creating your first availability slot
        </p>
      </div>
    );
  }

  // Group by day of week
  const slotsByDay = DAY_ORDER.reduce((acc, day) => {
    acc[day] = sortedSlots.filter((slot) => slot.dayOfWeek === day);
    return acc;
  }, {} as Record<string, AvailabilitySlot[]>);

  return (
    <div className="space-y-6">
      {DAY_ORDER.map((day) => {
        const daySlots = slotsByDay[day];
        if (daySlots.length === 0) return null;

        return (
          <div key={day} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{day}</h3>
              <Badge variant="outline">{daySlots.length} slots</Badge>
            </div>

            <div className="rounded-2xl border border-white/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Start Time</TableHead>
                    <TableHead>End Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {daySlots.map((slot) => {
                    const startTime = new Date(slot.startTime);
                    const endTime = new Date(slot.endTime);
                    const durationMinutes =
                      (endTime.getTime() - startTime.getTime()) / 1000 / 60;
                    const hours = Math.floor(durationMinutes / 60);
                    const minutes = durationMinutes % 60;

                    return (
                      <TableRow key={slot.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(startTime, "h:mm a")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {format(endTime, "h:mm a")}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {hours > 0 && `${hours}h `}
                          {minutes > 0 && `${minutes}m`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={slot.isActive ? "default" : "secondary"}
                          >
                            {slot.isActive ? "Active" : "Archived"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSlotClick(slot)}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
