"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Calendar,
  User,
  History,
  Loader2,
  Phone,
  Mail,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { statusBadge, statusLabel } from "@/lib/appointment-status";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { getAppointmentById } from "@/app/actions/queries.actions";
import { VisitNoteView } from "./visit-note-view";

interface AppointmentDetailsDialogProps {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentDetailsDialog({
  appointmentId,
  open,
  onOpenChange,
}: AppointmentDetailsDialogProps) {
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open && appointmentId) {
      loadAppointment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointmentId]);

  const loadAppointment = async () => {
    setIsLoading(true);
    try {
      const result = await getAppointmentById(appointmentId);
      if (result.success) {
        setAppointment(result.data);
      }
    } catch (error) {
      console.error("Error loading appointment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!appointment) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appointment Not Found</DialogTitle>
            <DialogDescription>
              The requested appointment could not be loaded.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">Appointment Details</DialogTitle>
              <DialogDescription>
                {format(new Date(appointment.scheduledAt), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={statusBadge(appointment.status)}
            >
              {statusLabel(appointment.status)}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="visit-note">Visit Note</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </div>
                </div>
                {appointment.patient.dateOfBirth && (
                  <div>
                    <div className="text-sm text-muted-foreground">Date of Birth</div>
                    <div className="font-medium">
                      {format(new Date(appointment.patient.dateOfBirth), "MMMM d, yyyy")}
                    </div>
                  </div>
                )}
                {appointment.patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.patient.email}</span>
                  </div>
                )}
                {appointment.patient.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.patient.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  Appointment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Provider</div>
                    <div className="font-medium">
                      {appointment.provider.title} {appointment.provider.firstName}{" "}
                      {appointment.provider.lastName}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="font-medium">
                      {appointment.type.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Date</div>
                    <div className="font-medium">
                      {format(new Date(appointment.scheduledAt), "MMMM d, yyyy")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div className="font-medium">
                      {format(new Date(appointment.scheduledAt), "h:mm a")} ({appointment.duration} min)
                    </div>
                  </div>
                </div>
                
                {appointment.reason && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Reason for Visit</div>
                      <div className="text-sm">{appointment.reason}</div>
                    </div>
                  </>
                )}
                
                {appointment.notes && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Notes</div>
                      <div className="text-sm">{appointment.notes}</div>
                    </div>
                  </>
                )}

                {appointment.checkedInAt && (
                  <>
                    <Separator />
                    <div>
                      <div className="text-sm text-muted-foreground">Checked In</div>
                      <div className="font-medium">
                        {format(new Date(appointment.checkedInAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  </>
                )}

                {appointment.checkedOutAt && (
                  <div>
                    <div className="text-sm text-muted-foreground">Checked Out</div>
                    <div className="font-medium">
                      {format(new Date(appointment.checkedOutAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          </TabsContent>

          <TabsContent value="visit-note">
            <VisitNoteView
              appointmentId={appointment.id}
              patientName={`${appointment.patient.firstName} ${appointment.patient.lastName}`}
              appointmentDate={new Date(appointment.scheduledAt)}
              canEdit={false} // Will be determined by backend authorization
            />
          </TabsContent>

          <TabsContent value="history">
            {appointment.appointmentHistory && appointment.appointmentHistory.length > 0 ? (
              <div className="space-y-4">
                {appointment.appointmentHistory.map((event: any) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-semibold text-sm">
                              {event.action.replace(/_/g, " ")}
                            </h4>
                          </div>
                          
                          {event.notes && (
                            <p className="text-sm text-muted-foreground">{event.notes}</p>
                          )}
                          
                          {event.field && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Field:</span> {event.field}
                              {event.previousValue && (
                                <span className="ml-2">
                                  <span className="font-medium">From:</span> {event.previousValue}
                                </span>
                              )}
                              {event.newValue && (
                                <span className="ml-2">
                                  <span className="font-medium">To:</span> {event.newValue}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(event.performedAt), "MMM d, yyyy 'at' h:mm a")}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {event.performer.provider
                            ? `${event.performer.provider.firstName} ${event.performer.provider.lastName}`
                            : event.performer.email}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No history available for this appointment</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
