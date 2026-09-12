"use client";

import { formatSlotTime } from "@/lib/clinic-time";

import { useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AvailabilitySlot } from "./schedule-calendar";

interface WeekViewProps {
  slots: AvailabilitySlot[];
  onSlotClick: (slot: AvailabilitySlot) => void;
  isLoading: boolean;
}

const DAYS_OF_WEEK = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeekView({ slots, onSlotClick, isLoading }: WeekViewProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeek(addDays(currentWeek, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addDays(currentWeek, 7));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const getSlotsByDay = (dayIndex: number) => {
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];
    return slots
      .filter((slot) => slot.dayOfWeek === dayOfWeek)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-sm font-medium">
          {format(weekStart, "MMM d")} - {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, dayIndex) => {
          const daySlots = getSlotsByDay(dayIndex);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={dayIndex}
              className={cn(
                "min-h-[200px] rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm p-3",
                isToday && "border-primary ring-2 ring-primary/20"
              )}
            >
              {/* Day Header */}
              <div className="mb-3 text-center">
                <div className="text-xs text-muted-foreground">
                  {DAY_LABELS[dayIndex]}
                </div>
                <div
                  className={cn(
                    "text-lg font-semibold",
                    isToday && "text-primary"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>

              {/* Slots */}
              <div className="space-y-2">
                {daySlots.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground">
                    No availability
                  </div>
                ) : (
                  daySlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => onSlotClick(slot)}
                      className={cn(
                        "w-full rounded-xl border p-2 text-left transition-all hover:bg-white/80 hover:shadow-sm",
                        slot.isActive
                          ? "border-green-200 bg-green-50/70 hover:bg-green-100/70"
                          : "border-slate-200 bg-slate-50/60 opacity-60"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-1 text-xs font-medium">
                            <Clock className="h-3 w-3" />
                            {formatSlotTime(slot.startTime)}
                          </div>
                          <div className="ml-4 text-xs text-muted-foreground">
                            {formatSlotTime(slot.endTime)}
                          </div>
                        </div>
                        {!slot.isActive && (
                          <Badge variant="secondary" className="text-[10px]">
                            Archived
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-green-200 bg-green-50/70" />
          Active slot
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded border border-slate-200 bg-slate-50/60 opacity-60" />
          Archived slot
        </div>
      </div>
    </div>
  );
}
