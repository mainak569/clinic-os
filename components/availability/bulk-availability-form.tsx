"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { bulkCreateAvailability } from "@/app/actions/bulk-availability.actions";

/**
 * Bulk Availability Form Component
 * 
 * Allows front desk to create recurring availability slots
 * Shows collision detection and detailed results
 */

const formSchema = z.object({
  providerId: z.string().min(1),
  daysOfWeek: z.array(z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"])).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  startDate: z.string(),
  endDate: z.string(),
  skipCollisions: z.boolean().default(false),
  overwriteExisting: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface BulkAvailabilityFormProps {
  providerId: string;
  providerName: string;
}

export function BulkAvailabilityForm({ providerId, providerName }: BulkAvailabilityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      providerId,
      daysOfWeek: [],
      startTime: "09:00",
      endTime: "17:00",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: format(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"), // 60 days
      skipCollisions: true,
      overwriteExisting: false,
    },
  });

  const daysOfWeek = [
    { value: "MONDAY", label: "Monday" },
    { value: "TUESDAY", label: "Tuesday" },
    { value: "WEDNESDAY", label: "Wednesday" },
    { value: "THURSDAY", label: "Thursday" },
    { value: "FRIDAY", label: "Friday" },
    { value: "SATURDAY", label: "Saturday" },
    { value: "SUNDAY", label: "Sunday" },
  ];

  const toggleDay = (day: string) => {
    const current = form.getValues("daysOfWeek");
    if (current.includes(day as any)) {
      form.setValue(
        "daysOfWeek",
        current.filter((d) => d !== day) as any
      );
    } else {
      form.setValue("daysOfWeek", [...current, day] as any);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    setResult(null);

    try {
      // Convert times to Date objects
      const [startHour, startMin] = values.startTime.split(":").map(Number);
      const [endHour, endMin] = values.endTime.split(":").map(Number);

      const startTime = new Date();
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date();
      endTime.setHours(endHour, endMin, 0, 0);

      const response = await bulkCreateAvailability({
        providerId: values.providerId,
        daysOfWeek: values.daysOfWeek as any,
        startTime,
        endTime,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        skipCollisions: values.skipCollisions,
        overwriteExisting: values.overwriteExisting,
      });

      if (response.success) {
        setResult(response.data);
        toast.success(
          `Created ${response.data.summary.successfullyCreated} slots`
        );
      } else {
        toast.error(response.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create availability slots");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Create Availability</CardTitle>
          <CardDescription>
            Create recurring availability slots for {providerName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Days of Week */}
              <FormField
                control={form.control}
                name="daysOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days of Week</FormLabel>
                    <FormDescription>
                      Select days to create availability
                    </FormDescription>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map((day) => (
                          <Badge
                            key={day.value}
                            variant={
                              field.value.includes(day.value as any)
                                ? "default"
                                : "outline"
                            }
                            className="cursor-pointer"
                            onClick={() => toggleDay(day.value)}
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Range */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input type="time" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <Input type="time" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Date Range */}
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Input type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Input type="date" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Options */}
              <div className="space-y-3 rounded-lg border p-4">
                <FormField
                  control={form.control}
                  name="skipCollisions"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Skip Collisions</FormLabel>
                        <FormDescription className="text-xs">
                          Skip dates that already have availability slots
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overwriteExisting"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Overwrite Existing</FormLabel>
                        <FormDescription className="text-xs">
                          Archive existing slots and create new ones
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Creating..." : "Create Availability Slots"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Summary */}
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border bg-green-50 p-3 dark:bg-green-950">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Created</span>
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {result.summary.successfullyCreated}
                </p>
              </div>

              <div className="rounded-lg border bg-amber-50 p-3 dark:bg-amber-950">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium">Skipped</span>
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {result.summary.skipped}
                </p>
              </div>

              <div className="rounded-lg border bg-blue-50 p-3 dark:bg-blue-950">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <p className="mt-1 text-2xl font-bold">
                  {result.summary.totalAttempted}
                </p>
              </div>
            </div>

            {/* Skipped Details */}
            {result.skipped.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Skipped Slots</h4>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {result.skipped.map((skip: any, index: number) => (
                    <div
                      key={index}
                      className="rounded-md border bg-muted/50 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {format(new Date(skip.date), "EEEE, MMM d")}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {skip.reason}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {skip.dayOfWeek}
                        </Badge>
                      </div>
                      {skip.collisionDetails && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Conflicts with existing slot:{" "}
                          {format(
                            new Date(skip.collisionDetails.existingStart),
                            "h:mm a"
                          )}{" "}
                          -{" "}
                          {format(
                            new Date(skip.collisionDetails.existingEnd),
                            "h:mm a"
                          )}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
