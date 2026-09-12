"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  FileText,
  Edit,
  History,
  Loader2,
  Calendar as CalendarIcon,
  User,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitNoteHistory } from "./visit-note-history";
import { VisitNoteForm } from "./visit-note-form";
import {
  getVisitNoteByAppointment,
  getVisitNoteHistory,
} from "@/app/actions/visit-note.actions";

/**
 * Visit Note View Component
 * 
 * Professional display of visit note with edit capability
 * Shows current version + complete history
 */

interface VisitNoteViewProps {
  appointmentId: string;
  patientName: string;
  appointmentDate: Date;
  canEdit: boolean; // Only author can edit
}

export function VisitNoteView({
  appointmentId,
  patientName,
  appointmentDate,
  canEdit,
}: VisitNoteViewProps) {
  const [visitNote, setVisitNote] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("current");

  useEffect(() => {
    loadVisitNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId]);

  const loadVisitNote = async () => {
    setIsLoading(true);
    try {
      const result = await getVisitNoteByAppointment({ appointmentId });
      
      if (result.success && result.data) {
        setVisitNote(result.data);
        
        // Load history
        const historyResult = await getVisitNoteHistory({ visitNoteId: result.data.id });
        if (historyResult.success) {
          setHistory(historyResult.data);
        }
      } else if (!result.success && result.error !== "Visit note not found") {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Failed to load visit note:", error);
      toast.error("Failed to load visit note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditMode(false);
    loadVisitNote();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // No visit note exists
  if (!visitNote) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visit Note
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
            <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
            <span>No visit note has been created for this appointment.</span>
          </div>
          {canEdit && (
            <VisitNoteForm
              appointmentId={appointmentId}
              mode="create"
              onSuccess={loadVisitNote}
              patientName={patientName}
              appointmentDate={appointmentDate}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // Edit mode
  if (isEditMode && canEdit) {
    return (
      <VisitNoteForm
        appointmentId={appointmentId}
        existingNote={visitNote}
        mode="edit"
        onSuccess={handleEditSuccess}
        onCancel={() => setIsEditMode(false)}
        patientName={patientName}
        appointmentDate={appointmentDate}
      />
    );
  }

  // View mode
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Visit Note
              </CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>
                    Author:{" "}
                    {visitNote.author?.provider
                      ? `${visitNote.author.provider.title || ""} ${visitNote.author.provider.firstName} ${visitNote.author.provider.lastName}`.trim()
                      : visitNote.author?.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    Created: {format(new Date(visitNote.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                {visitNote.lastEditedAt && visitNote.lastEditedAt !== visitNote.createdAt && (
                  <div className="flex items-center gap-2">
                    <History className="h-3 w-3" />
                    <span>
                      Last updated: {format(new Date(visitNote.lastEditedAt), "MMM d, yyyy 'at' h:mm a")}
                    </span>
                  </div>
                )}
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={() => setIsEditMode(true)} variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit Note
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="current">
            <FileText className="mr-2 h-4 w-4" />
            Current Note
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-6 mt-6">
          {/* Chief Complaint */}
          {visitNote.chiefComplaint && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chief Complaint</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{visitNote.chiefComplaint}</p>
              </CardContent>
            </Card>
          )}

          {/* SOAP Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Clinical Documentation (SOAP)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {visitNote.historyOfPresent && (
                <Section
                  badge="S"
                  title="Subjective"
                  subtitle="History of Present Illness"
                  content={visitNote.historyOfPresent}
                />
              )}

              {visitNote.physicalExam && (
                <>
                  <Separator />
                  <Section
                    badge="O"
                    title="Objective"
                    subtitle="Physical Examination"
                    content={visitNote.physicalExam}
                  />
                </>
              )}

              {visitNote.assessment && (
                <>
                  <Separator />
                  <Section
                    badge="A"
                    title="Assessment"
                    subtitle="Diagnosis & Evaluation"
                    content={visitNote.assessment}
                  />
                </>
              )}

              {visitNote.plan && (
                <>
                  <Separator />
                  <Section
                    badge="P"
                    title="Plan"
                    subtitle="Treatment Plan"
                    content={visitNote.plan}
                  />
                </>
              )}

              {!visitNote.historyOfPresent && !visitNote.physicalExam && !visitNote.assessment && !visitNote.plan && (
                <p className="text-sm text-muted-foreground italic">No SOAP documentation</p>
              )}
            </CardContent>
          </Card>

          {/* Vital Signs */}
          {(visitNote.bloodPressure ||
            visitNote.heartRate ||
            visitNote.temperature ||
            visitNote.respiratoryRate ||
            visitNote.oxygenSaturation ||
            visitNote.weight ||
            visitNote.height) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vital Signs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {visitNote.bloodPressure && (
                    <VitalCard label="Blood Pressure" value={visitNote.bloodPressure} unit="mmHg" />
                  )}
                  {visitNote.heartRate && (
                    <VitalCard label="Heart Rate" value={visitNote.heartRate} unit="bpm" />
                  )}
                  {visitNote.temperature && (
                    <VitalCard label="Temperature" value={visitNote.temperature} unit="°F" />
                  )}
                  {visitNote.respiratoryRate && (
                    <VitalCard label="Respiratory Rate" value={visitNote.respiratoryRate} unit="bpm" />
                  )}
                  {visitNote.oxygenSaturation && (
                    <VitalCard label="O2 Saturation" value={visitNote.oxygenSaturation} unit="%" />
                  )}
                  {visitNote.weight && (
                    <VitalCard label="Weight" value={visitNote.weight} unit="lbs" />
                  )}
                  {visitNote.height && (
                    <VitalCard label="Height" value={visitNote.height} unit="in" />
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders & Prescriptions */}
          {(visitNote.prescriptions ||
            visitNote.labOrders ||
            visitNote.imagingOrders ||
            visitNote.referrals) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Orders & Prescriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {visitNote.prescriptions && (
                  <Field label="Prescriptions" content={visitNote.prescriptions} />
                )}
                {visitNote.labOrders && (
                  <Field label="Laboratory Orders" content={visitNote.labOrders} />
                )}
                {visitNote.imagingOrders && (
                  <Field label="Imaging Orders" content={visitNote.imagingOrders} />
                )}
                {visitNote.referrals && (
                  <Field label="Referrals" content={visitNote.referrals} />
                )}
              </CardContent>
            </Card>
          )}

          {/* Follow-up */}
          {(visitNote.followUpInstructions || visitNote.nextVisitDate) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Follow-up</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {visitNote.followUpInstructions && (
                  <Field label="Instructions" content={visitNote.followUpInstructions} />
                )}
                {visitNote.nextVisitDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">Next Visit:</span>
                    <span>{format(new Date(visitNote.nextVisitDate), "MMMM d, yyyy")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <VisitNoteHistory versions={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({
  badge,
  title,
  subtitle,
  content,
}: {
  badge: string;
  title: string;
  subtitle: string;
  content: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{badge}</Badge>
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className="text-sm whitespace-pre-wrap ml-10">{content}</p>
    </div>
  );
}

function Field({ label, content }: { label: string; content: string }) {
  return (
    <div className="space-y-1">
      <h5 className="text-sm font-semibold text-muted-foreground">{label}</h5>
      <p className="text-sm whitespace-pre-wrap">{content}</p>
    </div>
  );
}

function VitalCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="font-semibold text-lg">
        {value}
        {unit && <span className="text-sm text-muted-foreground ml-1">{unit}</span>}
      </div>
    </div>
  );
}
