"use client";

import { formatSlotTime } from "@/lib/clinic-time";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AvailabilitySlot } from "./schedule-calendar";

interface MonthViewProps {
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

export function MonthView({ slots, onSlotClick, isLoading }: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const goToPreviousMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getSlotsByDay = (date: Date) => {
    const dayIndex = date.getDay();
    const dayOfWeek = DAYS_OF_WEEK[dayIndex];
    return slots
      .filter((slot) => slot.dayOfWeek === dayOfWeek && slot.isActive)
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );
  };

  // Generate calendar days
  const calendarDays: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-lg font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl border border-white/60 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-white/60 bg-white/40">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="border-r p-2 text-center text-sm font-medium last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const daySlots = getSlotsByDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={index}
                className={cn(
                  "min-h-[100px] border-b border-r p-2 last:border-r-0",
                  !isCurrentMonth && "bg-muted/20",
                  isToday && "bg-primary/5"
                )}
              >
                {/* Date number */}
                <div className="mb-1 flex items-center justify-between">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                      isToday && "bg-primary text-primary-foreground",
                      !isCurrentMonth && "text-muted-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  {daySlots.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                      {daySlots.length}
                    </Badge>
                  )}
                </div>

                {/* Slots */}
                <div className="space-y-1">
                  {daySlots.slice(0, 2).map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => onSlotClick(slot)}
                      className="w-full rounded bg-green-100/80 px-1.5 py-0.5 text-left text-[10px] text-green-800 transition-colors hover:bg-green-200/80"
                    >
                      {formatSlotTime(slot.startTime)}
                    </button>
                  ))}
                  {daySlots.length > 2 && (
                    <div className="text-center text-[10px] text-muted-foreground">
                      +{daySlots.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground">
        Click on a time slot to edit or manage availability
      </div>
    </div>
  );
}
