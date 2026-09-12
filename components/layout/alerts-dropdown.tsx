"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CalendarX,
  CheckCheck,
  Eye,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getMyAlerts,
  getUnreadAlertCount,
  markAlertRead,
  dismissAlert,
  markAllAlertsRead,
} from "@/app/actions/alert.actions";

interface Alert {
  id: string;
  type: string;
  priority: string;
  title: string;
  message: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  appointment?: {
    id: string;
    scheduledAt: string;
    patient: {
      firstName: string;
      lastName: string;
    };
  };
}

export function AlertsDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [alertsResult, countResult] = await Promise.all([
        getMyAlerts(false), // Only unread
        getUnreadAlertCount(),
      ]);

      if (alertsResult.success) {
        setAlerts(alertsResult.data);
      }

      if (countResult.success) {
        setUnreadCount(countResult.data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Poll for new alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleViewAlert = async (alert: Alert) => {
    try {
      // Mark as read
      await markAlertRead(alert.id);

      // Navigate to appointment if available
      if (alert.appointment) {
        router.push(`/dashboard/appointments?highlight=${alert.appointment.id}`);
      }

      // Refresh alerts
      fetchAlerts();
      setOpen(false);
    } catch (error) {
      toast.error("Failed to open alert");
    }
  };

  const handleDismiss = async (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const result = await dismissAlert(alertId);
      if (result.success) {
        toast.success("Alert dismissed");
        fetchAlerts();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to dismiss alert");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllAlertsRead();
      if (result.success) {
        toast.success(`Marked ${result.data.count} alerts as read`);
        fetchAlerts();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to mark alerts as read");
    }
  };

  const AlertIcon = (type: string) => {
    switch (type) {
      case "APPOINTMENT_REMINDER":
        return CalendarClock;
      case "URGENT_APPOINTMENT":
        return AlertTriangle;
      case "APPOINTMENT_CANCELLED":
        return CalendarX;
      default:
        return Bell;
    }
  };

  const priorityStyles = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
      case "HIGH":
        return {
          badge: "border-red-200 bg-red-50/80 text-red-700",
          icon: "text-red-500",
        };
      case "MEDIUM":
        return {
          badge: "border-amber-200 bg-amber-50/80 text-amber-700",
          icon: "text-amber-500",
        };
      case "LOW":
        return {
          badge: "border-purple-200 bg-purple-50/80 text-purple-700",
          icon: "text-[#A855F7]",
        };
      default:
        return {
          badge: "border-slate-200 bg-slate-50/80 text-slate-600",
          icon: "text-slate-400",
        };
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full bg-white/50 text-gray-700 shadow-md hover:bg-white/80 hover:text-[#A855F7] hover:shadow-lg"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white/70">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">
            Notifications ({unreadCount} unread)
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(24rem,calc(100vw-2rem))] p-0" align="end">
        <div className="flex items-center justify-between border-b border-white/60 px-4 py-3">
          <h3 className="font-semibold">Alerts</h3>
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {loading && alerts.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading alerts…
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#A855F7]/10">
                <Bell className="h-6 w-6 text-[#A855F7]" />
              </div>
              <p className="mt-3 text-sm font-medium">No new alerts</p>
              <p className="text-xs text-muted-foreground">
                You&apos;re all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/60">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`group relative cursor-pointer p-4 transition-colors hover:bg-white/60 ${
                    !alert.isRead ? "bg-[#A855F7]/[0.06]" : ""
                  }`}
                  onClick={() => handleViewAlert(alert)}
                >
                  <div className="flex gap-3">
                    {(() => {
                      const Icon = AlertIcon(alert.type);
                      return (
                        <Icon
                          className={`mt-0.5 h-5 w-5 shrink-0 ${priorityStyles(alert.priority).icon}`}
                        />
                      );
                    })()}
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">
                          {alert.title}
                        </p>
                        <Badge
                          variant="outline"
                          className={`shrink-0 ${priorityStyles(alert.priority).badge}`}
                        >
                          {alert.priority}
                        </Badge>
                      </div>

                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {alert.message.split("[ID:")[0].trim()}
                      </p>

                      {alert.appointment && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {alert.appointment.patient.firstName}{" "}
                            {alert.appointment.patient.lastName}
                          </span>
                          <span>•</span>
                          <span>
                            {format(
                              new Date(alert.appointment.scheduledAt),
                              "MMM d, h:mm a"
                            )}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                      onClick={(e) => handleDismiss(alert.id, e)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Dismiss</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {alerts.length > 0 && (
          <div className="border-t border-white/60 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs"
              onClick={() => {
                router.push("/dashboard/appointments");
                setOpen(false);
              }}
            >
              <Eye className="mr-2 h-3 w-3" />
              View all appointments
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
