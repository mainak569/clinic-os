"use client";

import { Clock, User, FileText, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Appointment Timeline Component
 * 
 * Displays immutable history of appointment changes
 * Shows status changes, provider changes, and notes
 */

interface TimelineEvent {
  id: string;
  action: string;
  field?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  notes?: string | null;
  performedAt: Date;
  performer: {
    id: string;
    email: string;
    provider?: {
      firstName: string;
      lastName: string;
      title?: string | null;
    } | null;
  };
}

interface AppointmentTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const ACTION_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  CREATED: {
    label: "Appointment Created",
    icon: Calendar,
    color: "text-blue-600",
  },
  CONFIRMED: {
    label: "Appointment Confirmed",
    icon: Calendar,
    color: "text-green-600",
  },
  CHECKED_IN: {
    label: "Patient Checked In",
    icon: User,
    color: "text-purple-600",
  },
  COMPLETED: {
    label: "Appointment Completed",
    icon: Calendar,
    color: "text-emerald-600",
  },
  NO_SHOW: {
    label: "Patient No-Show",
    icon: AlertCircle,
    color: "text-orange-600",
  },
  CANCELLED: {
    label: "Appointment Cancelled",
    icon: AlertCircle,
    color: "text-red-600",
  },
  RESCHEDULED: {
    label: "Appointment Rescheduled",
    icon: Calendar,
    color: "text-amber-600",
  },
  PROVIDER_CHANGED: {
    label: "Provider Changed",
    icon: User,
    color: "text-indigo-600",
  },
  SUPPORTING_PROVIDER_ADDED: {
    label: "Supporting Provider Added",
    icon: User,
    color: "text-teal-600",
  },
  SUPPORTING_PROVIDER_REMOVED: {
    label: "Supporting Provider Removed",
    icon: User,
    color: "text-gray-600",
  },
  NOTE_ADDED: {
    label: "Note Added",
    icon: FileText,
    color: "text-slate-600",
  },
  NOTE_UPDATED: {
    label: "Note Updated",
    icon: FileText,
    color: "text-slate-600",
  },
  UPDATED: {
    label: "Appointment Updated",
    icon: Calendar,
    color: "text-gray-600",
  },
};

export function AppointmentTimeline({
  events,
  className,
}: AppointmentTimelineProps) {
  if (events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Appointment Timeline
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Immutable audit trail of all changes
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          {/* Timeline line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

          {events.map((event) => {
            const actionConfig = ACTION_LABELS[event.action] || {
              label: event.action,
              icon: Clock,
              color: "text-gray-600",
            };
            const Icon = actionConfig.icon;

            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-background ${actionConfig.color}`}
                  >
                    <div className="h-2 w-2 rounded-full bg-current" />
                  </div>
                </div>

                {/* Event content */}
                <div className="flex-1 space-y-1 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${actionConfig.color}`} />
                      <h4 className="font-semibold text-sm">
                        {actionConfig.label}
                      </h4>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {format(new Date(event.performedAt), "MMM d, h:mm a")}
                    </Badge>
                  </div>

                  {/* Performer */}
                  <div className="text-xs text-muted-foreground">
                    By:{" "}
                    {event.performer.provider ? (
                      <span className="font-medium">
                        {event.performer.provider.title}{" "}
                        {event.performer.provider.firstName}{" "}
                        {event.performer.provider.lastName}
                      </span>
                    ) : (
                      <span className="font-medium">
                        {event.performer.email}
                      </span>
                    )}
                  </div>

                  {/* Field change details */}
                  {event.field && (
                    <div className="rounded-md bg-muted/50 p-2 text-xs space-y-1">
                      <div className="font-medium text-muted-foreground">
                        Field: {event.field}
                      </div>
                      {event.previousValue && (
                        <div>
                          <span className="text-muted-foreground">From:</span>{" "}
                          <span className="font-mono">{event.previousValue}</span>
                        </div>
                      )}
                      {event.newValue && (
                        <div>
                          <span className="text-muted-foreground">To:</span>{" "}
                          <span className="font-mono">{event.newValue}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes/reason */}
                  {event.notes && (
                    <div className="rounded-md bg-muted/50 p-2 text-xs">
                      <div className="font-medium text-muted-foreground mb-1">
                        Notes:
                      </div>
                      <div className="text-foreground">{event.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Immutability notice */}
        <div className="mt-6 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-100">
              <p className="font-semibold mb-1">Immutable Audit Trail</p>
              <p>
                This history cannot be modified or deleted. All changes are
                permanently recorded for compliance and regulatory purposes.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
