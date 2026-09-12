"use client";

import { FileText, AlertCircle, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * Visit Note History Component
 * 
 * Displays immutable history of visit note edits
 * Shows complete snapshots of each version
 */

interface VisitNoteVersion {
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
  // Clinical fields
  chiefComplaint?: string | null;
  historyOfPresent?: string | null;
  physicalExam?: string | null;
  assessment?: string | null;
  plan?: string | null;
  // Vitals
  bloodPressure?: string | null;
  heartRate?: number | null;
  temperature?: number | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  weight?: number | null;
  height?: number | null;
  // Orders
  prescriptions?: string | null;
  labOrders?: string | null;
  imagingOrders?: string | null;
  referrals?: string | null;
  followUpInstructions?: string | null;
  nextVisitDate?: Date | null;
}

interface VisitNoteHistoryProps {
  versions: VisitNoteVersion[];
  className?: string;
}

export function VisitNoteHistory({
  versions,
  className,
}: VisitNoteHistoryProps) {
  if (versions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visit Note History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No edit history available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Visit Note History ({versions.length} versions)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete edit history with snapshots
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {versions.map((version, index) => (
            <VersionCard
              key={version.id}
              version={version}
              versionNumber={versions.length - index}
              isLatest={index === 0}
            />
          ))}
        </div>

        {/* Immutability notice */}
        <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50/70 backdrop-blur-sm p-3">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-[#A855F7] mt-0.5" />
            <div className="text-xs text-purple-900">
              <p className="font-semibold mb-1">Immutable Medical Records</p>
              <p>
                All versions are permanently preserved and cannot be modified or
                deleted. This ensures compliance with healthcare regulations and
                maintains a complete audit trail.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VersionCard({
  version,
  versionNumber,
  isLatest,
}: {
  version: VisitNoteVersion;
  versionNumber: number;
  isLatest: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-2xl border border-white/60 bg-white/40 backdrop-blur-sm">
        <CollapsibleTrigger asChild>
          <div className="flex items-start justify-between p-4 cursor-pointer hover:bg-white/60 transition-colors">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={isLatest ? "default" : "secondary"}>
                  Version {versionNumber}
                </Badge>
                {isLatest && (
                  <Badge variant="outline" className="bg-green-100/80 text-green-700 border-green-200">
                    Latest
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {format(new Date(version.editedAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Edited by:</span>{" "}
                {version.editor.provider ? (
                  <span className="font-medium">
                    {version.editor.provider.title}{" "}
                    {version.editor.provider.firstName}{" "}
                    {version.editor.provider.lastName}
                  </span>
                ) : (
                  <span className="font-medium">{version.editor.email}</span>
                )}
              </div>

              {version.changeReason && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Reason:</span>{" "}
                  <span className="font-medium">{version.changeReason}</span>
                </div>
              )}
            </div>

            <Button variant="ghost" size="sm" className="h-auto p-2">
              <ChevronRight
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-90" : ""
                }`}
              />
            </Button>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-4 bg-muted/20">
            {/* Clinical Documentation */}
            <Section title="Clinical Documentation">
              <Field label="Chief Complaint" value={version.chiefComplaint} />
              <Field
                label="History of Present Illness"
                value={version.historyOfPresent}
              />
              <Field label="Physical Exam" value={version.physicalExam} />
              <Field label="Assessment" value={version.assessment} />
              <Field label="Plan" value={version.plan} />
            </Section>

            {/* Vital Signs */}
            <Section title="Vital Signs">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <VitalField
                  label="Blood Pressure"
                  value={version.bloodPressure}
                />
                <VitalField
                  label="Heart Rate"
                  value={version.heartRate}
                  unit="bpm"
                />
                <VitalField
                  label="Temperature"
                  value={version.temperature}
                  unit="°F"
                />
                <VitalField
                  label="Respiratory Rate"
                  value={version.respiratoryRate}
                  unit="bpm"
                />
                <VitalField
                  label="O2 Saturation"
                  value={version.oxygenSaturation}
                  unit="%"
                />
                <VitalField label="Weight" value={version.weight} unit="lbs" />
                <VitalField label="Height" value={version.height} unit="in" />
              </div>
            </Section>

            {/* Orders & Prescriptions */}
            <Section title="Orders & Prescriptions">
              <Field label="Prescriptions" value={version.prescriptions} />
              <Field label="Lab Orders" value={version.labOrders} />
              <Field label="Imaging Orders" value={version.imagingOrders} />
              <Field label="Referrals" value={version.referrals} />
            </Section>

            {/* Follow-up */}
            <Section title="Follow-up">
              <Field
                label="Instructions"
                value={version.followUpInstructions}
              />
              {version.nextVisitDate && (
                <div className="text-sm">
                  <span className="font-medium text-muted-foreground">
                    Next Visit:
                  </span>{" "}
                  <span>
                    {format(new Date(version.nextVisitDate), "MMM d, yyyy")}
                  </span>
                </div>
              )}
            </Section>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-muted-foreground">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null | undefined }) {
  if (!value) return null;

  return (
    <div className="text-sm">
      <span className="font-medium text-muted-foreground">{label}:</span>{" "}
      <span className="whitespace-pre-wrap">{value}</span>
    </div>
  );
}

function VitalField({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number | string | null | undefined;
  unit?: string;
}) {
  if (value === null || value === undefined) return null;

  return (
    <div className="rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm p-2">
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div className="font-semibold">
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
      </div>
    </div>
  );
}
