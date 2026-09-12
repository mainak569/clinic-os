/**
 * Example: Appointment Detail Page with Timeline and Visit Notes
 * 
 * This is a reference implementation showing how to use the audit trail components.
 * Copy and adapt this for your actual appointment detail pages.
 */

import { AppointmentTimeline } from "./appointment-timeline";
import { VisitNoteHistory } from "./visit-note-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  User,
  FileText,
  History,
  Edit,
} from "lucide-react";
import { format } from "date-fns";

/**
 * Example data structure (from your server actions/database)
 */
interface AppointmentDetailProps {
  appointment: {
    id: string;
    scheduledAt: Date;
    duration: number;
    status: string;
    type: string;
    reason?: string;
    patient: {
      firstName: string;
      lastName: string;
      dateOfBirth?: Date;
    };
    provider: {
      firstName: string;
      lastName: string;
      title?: string;
    };
  };
  visitNote?: {
    id: string;
    authorId: string;
    createdAt: Date;
    lastEditedAt?: Date;
    chiefComplaint?: string;
    assessment?: string;
    plan?: string;
    // ... other fields
  } | null;
  appointmentHistory: Array<{
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
  }>;
  visitNoteHistory?: Array<{
    id: string;
    editedAt: Date;
    changeReason?: string | null;
    editor: {
      id: string;
      email: string;
      provider?: {
        firstName: string;
        lastName: string;
        title?: string | null;
      } | null;
    };
    // ... all clinical fields
  }>;
  canEditNote?: boolean;
  isAuthor?: boolean;
}

export function AppointmentDetailExample({
  appointment,
  visitNote,
  appointmentHistory,
  visitNoteHistory = [],
  canEditNote = false,
  isAuthor = false,
}: AppointmentDetailProps) {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Appointment Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Appointment Details</CardTitle>
              <p className="text-muted-foreground mt-1">
                {format(appointment.scheduledAt, "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <Badge
              variant={
                appointment.status === "COMPLETED"
                  ? "default"
                  : appointment.status === "CANCELLED"
                    ? "destructive"
                    : "secondary"
              }
            >
              {appointment.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Patient Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-semibold">Patient</span>
              </div>
              <p className="font-medium">
                {appointment.patient.firstName} {appointment.patient.lastName}
              </p>
              {appointment.patient.dateOfBirth && (
                <p className="text-sm text-muted-foreground">
                  DOB: {format(appointment.patient.dateOfBirth, "MM/dd/yyyy")}
                </p>
              )}
            </div>

            {/* Provider Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-semibold">Provider</span>
              </div>
              <p className="font-medium">
                {appointment.provider.title} {appointment.provider.firstName}{" "}
                {appointment.provider.lastName}
              </p>
            </div>

            {/* Appointment Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="font-semibold">Type & Duration</span>
              </div>
              <p className="font-medium">
                {appointment.type} ({appointment.duration} minutes)
              </p>
            </div>

            {/* Reason */}
            {appointment.reason && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">Reason</span>
                </div>
                <p className="font-medium">{appointment.reason}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Visit Note vs History */}
      <Tabs defaultValue="note" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="note" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Visit Note
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Visit Note Tab */}
        <TabsContent value="note" className="space-y-4">
          {visitNote ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Clinical Documentation
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {format(visitNote.createdAt, "MMM d, yyyy")}
                        {visitNote.lastEditedAt && (
                          <>
                            {" · Last edited "}
                            {format(visitNote.lastEditedAt, "MMM d, yyyy")}
                          </>
                        )}
                      </p>
                    </div>
                    {canEditNote && isAuthor && (
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Note
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {visitNote.chiefComplaint && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">
                        Chief Complaint
                      </h4>
                      <p className="text-sm">{visitNote.chiefComplaint}</p>
                    </div>
                  )}
                  {visitNote.assessment && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Assessment</h4>
                      <p className="text-sm">{visitNote.assessment}</p>
                    </div>
                  )}
                  {visitNote.plan && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Plan</h4>
                      <p className="text-sm">{visitNote.plan}</p>
                    </div>
                  )}

                  {!isAuthor && canEditNote && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 backdrop-blur-sm p-3">
                      <p className="text-xs text-amber-900">
                        <span className="font-semibold">Note:</span> Only the
                        original author can edit this note. You can view the
                        complete history below.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Visit Note History */}
              {visitNoteHistory.length > 0 && (
                <VisitNoteHistory versions={visitNoteHistory} />
              )}
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Visit Note</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  No visit note has been created for this appointment yet.
                </p>
                {canEditNote && appointment.status === "COMPLETED" && (
                  <Button className="mt-4">
                    <FileText className="h-4 w-4 mr-2" />
                    Create Visit Note
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <AppointmentTimeline events={appointmentHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
