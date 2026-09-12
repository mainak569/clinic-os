"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Save, FileText, Stethoscope, ClipboardList, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createVisitNote, updateVisitNote } from "@/app/actions/visit-note.actions";

/**
 * Visit Note Form Component
 * 
 * Professional clinical documentation interface
 * Supports SOAP format + vitals + orders
 */

const visitNoteFormSchema = z.object({
  // Chief Complaint & SOAP
  chiefComplaint: z.string().optional(),
  historyOfPresent: z.string().optional(),
  physicalExam: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  
  // Vital Signs
  bloodPressure: z.string().optional(),
  heartRate: z.string().optional(),
  temperature: z.string().optional(),
  respiratoryRate: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  
  // Orders & Treatment
  prescriptions: z.string().optional(),
  labOrders: z.string().optional(),
  imagingOrders: z.string().optional(),
  referrals: z.string().optional(),
  
  // Follow-up
  followUpInstructions: z.string().optional(),
  nextVisitDate: z.date().optional(),
  
  // Amendment reason (for updates only)
  changeReason: z.string().optional(),
});

type FormValues = z.infer<typeof visitNoteFormSchema>;

interface VisitNoteFormProps {
  appointmentId: string;
  existingNote?: any;
  mode: "create" | "edit";
  onSuccess: () => void;
  onCancel?: () => void;
  patientName: string;
  appointmentDate: Date;
}

export function VisitNoteForm({
  appointmentId,
  existingNote,
  mode,
  onSuccess,
  onCancel,
  patientName,
  appointmentDate,
}: VisitNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(visitNoteFormSchema),
    defaultValues: {
      chiefComplaint: existingNote?.chiefComplaint || "",
      historyOfPresent: existingNote?.historyOfPresent || "",
      physicalExam: existingNote?.physicalExam || "",
      assessment: existingNote?.assessment || "",
      plan: existingNote?.plan || "",
      bloodPressure: existingNote?.bloodPressure || "",
      heartRate: existingNote?.heartRate?.toString() || "",
      temperature: existingNote?.temperature?.toString() || "",
      respiratoryRate: existingNote?.respiratoryRate?.toString() || "",
      oxygenSaturation: existingNote?.oxygenSaturation?.toString() || "",
      weight: existingNote?.weight?.toString() || "",
      height: existingNote?.height?.toString() || "",
      prescriptions: existingNote?.prescriptions || "",
      labOrders: existingNote?.labOrders || "",
      imagingOrders: existingNote?.imagingOrders || "",
      referrals: existingNote?.referrals || "",
      followUpInstructions: existingNote?.followUpInstructions || "",
      nextVisitDate: existingNote?.nextVisitDate ? new Date(existingNote.nextVisitDate) : undefined,
      changeReason: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      // Convert string numbers to actual numbers
      const heartRate = values.heartRate ? parseInt(values.heartRate) : undefined;
      const temperature = values.temperature ? parseFloat(values.temperature) : undefined;
      const respiratoryRate = values.respiratoryRate ? parseInt(values.respiratoryRate) : undefined;
      const oxygenSaturation = values.oxygenSaturation ? parseInt(values.oxygenSaturation) : undefined;
      const weight = values.weight ? parseFloat(values.weight) : undefined;
      const height = values.height ? parseFloat(values.height) : undefined;

      if (mode === "create") {
        const result = await createVisitNote({
          appointmentId,
          chiefComplaint: values.chiefComplaint,
          historyOfPresent: values.historyOfPresent,
          physicalExam: values.physicalExam,
          assessment: values.assessment,
          plan: values.plan,
          bloodPressure: values.bloodPressure,
          heartRate,
          temperature,
          respiratoryRate,
          oxygenSaturation,
          weight,
          height,
          prescriptions: values.prescriptions,
          labOrders: values.labOrders,
          imagingOrders: values.imagingOrders,
          referrals: values.referrals,
          followUpInstructions: values.followUpInstructions,
          nextVisitDate: values.nextVisitDate,
        });

        if (result.success) {
          toast.success("Visit note created successfully");
          onSuccess();
        } else {
          toast.error(result.error);
        }
      } else {
        if (!existingNote?.id) {
          toast.error("Visit note ID not found");
          return;
        }

        const result = await updateVisitNote({
          visitNoteId: existingNote.id,
          changeReason: values.changeReason,
          chiefComplaint: values.chiefComplaint,
          historyOfPresent: values.historyOfPresent,
          physicalExam: values.physicalExam,
          assessment: values.assessment,
          plan: values.plan,
          bloodPressure: values.bloodPressure,
          heartRate,
          temperature,
          respiratoryRate,
          oxygenSaturation,
          weight,
          height,
          prescriptions: values.prescriptions,
          labOrders: values.labOrders,
          imagingOrders: values.imagingOrders,
          referrals: values.referrals,
          followUpInstructions: values.followUpInstructions,
          nextVisitDate: values.nextVisitDate,
        });

        if (result.success) {
          toast.success("Visit note updated successfully");
          onSuccess();
        } else {
          toast.error(result.error);
        }
      }
    } catch (error) {
      console.error("Failed to save visit note:", error);
      toast.error("Failed to save visit note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {mode === "create" ? "Create Visit Note" : "Edit Visit Note"}
            </CardTitle>
            <CardDescription>
              Patient: {patientName} • {format(appointmentDate, "MMMM d, yyyy")}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Amendment Reason (Edit Only) */}
        {mode === "edit" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Amendment Reason</CardTitle>
              <CardDescription>
                Required: Explain why you are updating this note
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="changeReason"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Correcting medication dosage, Adding follow-up instructions..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Chief Complaint */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Chief Complaint
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="chiefComplaint"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Primary reason for visit..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Main symptom or concern in patient&apos;s own words
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* SOAP Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5" />
              Clinical Documentation (SOAP)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Subjective */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">S</Badge>
                <h4 className="font-semibold">Subjective</h4>
              </div>
              <FormField
                control={form.control}
                name="historyOfPresent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>History of Present Illness</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed history of the present condition..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Patient history, symptoms, timeline, and relevant details
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Objective */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">O</Badge>
                <h4 className="font-semibold">Objective</h4>
              </div>
              <FormField
                control={form.control}
                name="physicalExam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Physical Examination</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Physical examination findings..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Observable findings, test results, measurements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Assessment */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">A</Badge>
                <h4 className="font-semibold">Assessment</h4>
              </div>
              <FormField
                control={form.control}
                name="assessment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnosis & Assessment</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Clinical impression, diagnosis, differential diagnosis..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Medical evaluation and diagnostic conclusions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Plan */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">P</Badge>
                <h4 className="font-semibold">Plan</h4>
              </div>
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Treatment Plan</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Treatment approach, management strategy..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Proposed treatment and management approach
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vital Signs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control}
                name="bloodPressure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Pressure</FormLabel>
                    <FormControl>
                      <Input placeholder="120/80" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">mmHg</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="heartRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heart Rate</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="72" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">bpm</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="98.6" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">°F</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="respiratoryRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Respiratory Rate</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="16" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">breaths/min</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="oxygenSaturation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O2 Saturation</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="98" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">%</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="150" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">lbs</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Height</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="68" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">inches</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders & Prescriptions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Orders & Prescriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="prescriptions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescriptions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Medication name, dosage, frequency, duration..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="labOrders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Laboratory Orders</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="CBC, CMP, lipid panel..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imagingOrders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imaging Orders</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="X-ray, CT, MRI, ultrasound..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referrals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referrals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Specialist referrals..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Follow-up */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Follow-up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="followUpInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Follow-up Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Post-visit instructions, warnings, when to seek care..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nextVisitDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Next Visit Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Optional: Schedule next appointment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? "Create Visit Note" : "Save Changes"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
