"use client";

import { useEffect, useState } from "react";
import { Bell, X, Check, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getMyAlerts,
  markAlertRead,
  dismissAlert,
  markAllAlertsRead,
  getUnreadAlertCount,
} from "@/app/actions/alert.actions";

/**
 * Alert Panel Component
 * 
 * Displays appointment alerts with priority indicators
 * Shows REQUESTED appointments within 24 hours and 1 hour before
 */

export function AlertPanel() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = async () => {
    try {
      const result = await getMyAlerts(false); // Only unread
      if (result.success) {
        setAlerts(result.data);
      }

      const countResult = await getUnreadAlertCount();
      if (countResult.success) {
        setUnreadCount(countResult.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();

    // Refresh every 5 minutes
    const interval = setInterval(loadAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (alertId: string) => {
    const result = await markAlertRead(alertId);
    if (result.success) {
      loadAlerts();
      toast.success("Alert marked as read");
    }
  };

  const handleDismiss = async (alertId: string) => {
    const result = await dismissAlert(alertId);
    if (result.success) {
      loadAlerts();
      toast.success("Alert dismissed");
    }
  };

  const handleMarkAllRead = async () => {
    const result = await markAllAlertsRead();
    if (result.success) {
      loadAlerts();
      toast.success(`${result.data.count} alerts marked as read`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-600 text-white";
      case "HIGH":
        return "bg-orange-500 text-white";
      case "MEDIUM":
        return "bg-yellow-500 text-white";
      case "LOW":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading alerts...</p>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Check className="h-4 w-4 text-green-600" />
            <span>No active alerts</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {alerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg border bg-card p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1">
                {alert.priority === "HIGH" || alert.priority === "CRITICAL" ? (
                  <AlertCircle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                ) : (
                  <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(alert.priority)}
                    >
                      {alert.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.message.split("[ID:")[0].trim()}
                  </p>
                  {alert.appointment && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Patient: {alert.appointment.patient.firstName}{" "}
                        {alert.appointment.patient.lastName}
                      </span>
                      <span>•</span>
                      <span>
                        {format(
                          new Date(alert.appointment.scheduledAt),
                          "MMM d 'at' h:mm a"
                        )}
                      </span>
                      <span>•</span>
                      <Badge variant="outline" className="text-xs">
                        {alert.appointment.status}
                      </Badge>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(alert.createdAt), "MMM d, h:mm a")}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMarkRead(alert.id)}
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(alert.id)}
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
