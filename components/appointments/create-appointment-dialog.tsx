"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@/lib/hooks/use-mutation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import { type CreateAppointmentInput } from "@/lib/validations/appointment";
import { createAppointment } from "@/app/actions/appointment.actions";
import { getProviders } from "@/app/actions/queries.actions";
import { z } from "zod";
import { AppointmentType } from "@prisma/client";

// Frontend form schema with separate date and time fields
const appointmentFormSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  providerId: z.string().min(1, "Provider is required"),
  appointmentDate: z.date({
    error: "Appointment date is required",
  }),
  appointmentTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(240, "Duration cannot exceed 4 hours"),
  type: z.nativeEnum(AppointmentType),
  reason: z.string().min(1, "Reason is required").max(500, "Reason too long"),
  notes: z.string().max(1000, "Notes too long").optional(),
});

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  userRole: string;
  providerId?: string;
}

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  onSuccess,
  userRole,
  providerId,
}: CreateAppointmentDialogProps) {
  const [providers, setProviders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [providerSchedule, setProviderSchedule] = useState<string>("");

  const createMutation = useMutation(createAppointment, {
    onSuccess: () => {
      form.reset();
      onSuccess();
      onOpenChange(false);
    },
    successMessage: "Appointment created successfully",
    errorMessage: (error) => error || "Failed to create appointment",
    retryCount: 2,
  });

  const form = useForm({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: "",
      providerId: providerId || "",
      appointmentDate: new Date(),
      appointmentTime: "09:00",
      duration: 30,
      type: "FOLLOW_UP" as AppointmentType,
      reason: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      loadProviders();
      loadPatients();
      // Reset form with current date and time when dialog opens
      const now = new Date();
      form.setValue('appointmentDate', now);
      form.setValue('appointmentTime', `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadProviders = async () => {
    try {
      if (userRole === "FRONT_DESK") {
        const result = await getProviders();
        if (result.success && Array.isArray(result.data)) {
          setProviders(result.data);
        } else {
          setProviders([]);
        }
      } else if (providerId) {
        // Provider can only create appointments for themselves
        const result = await getProviders();
        if (result.success && Array.isArray(result.data)) {
          const provider = result.data.find((p: any) => p.id === providerId);
          if (provider) {
            setProviders([provider]);
            loadProviderSchedule(provider.id);
          } else {
            setProviders([]);
          }
        } else {
          setProviders([]);
        }
      }
    } catch (error) {
      console.error("Failed to load providers:", error);
      setProviders([]);
    }
  };

  const loadProviderSchedule = async (providerId: string) => {
    try {
      console.log('Loading schedule for provider:', providerId);
      const response = await fetch(`/api/providers/${providerId}`);
      console.log('Provider API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Provider API data:', data);
        console.log('Availability slots:', data.availabilitySlots);
        
        if (data.availabilitySlots && data.availabilitySlots.length > 0) {
          // Format availability schedule for display
          const schedule = formatAvailabilitySchedule(data.availabilitySlots);
          console.log('Formatted schedule:', schedule);
          setProviderSchedule(schedule);
        } else {
          console.log('No availability slots found');
          setProviderSchedule("No availability configured. Please set up availability on the Schedule page.");
        }
      } else {
        console.error('Provider API request failed:', response.status, await response.text());
        setProviderSchedule("Unable to load availability. Please try again.");
      }
    } catch (error) {
      console.error("Failed to load provider schedule:", error);
      setProviderSchedule("Unable to load availability. Please try again.");
    }
  };

  const formatAvailabilitySchedule = (slots: any[]): string => {
    if (!slots || slots.length === 0) return "No availability";

    // Group by day of week
    const dayGroups: Record<string, { start: string; end: string }[]> = {};
    
    slots.forEach((slot: any) => {
      console.log('Formatting slot:', {
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        startDate: new Date(slot.startTime),
        endDate: new Date(slot.endTime),
      });
      const day = slot.dayOfWeek;
      const startTime = new Date(slot.startTime).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const endTime = new Date(slot.endTime).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      if (!dayGroups[day]) {
        dayGroups[day] = [];
      }
      dayGroups[day].push({ start: startTime, end: endTime });
    });

    // Format for display
    const dayOrder = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    const lines: string[] = [];

    // Try to find consecutive days with same hours
    const daysInGroup = Object.keys(dayGroups);
    if (daysInGroup.length > 0) {
      // Simple format: just show first day's hours as example
      const firstDay = dayOrder.find(d => dayGroups[d]);
      if (firstDay) {
        const hours = dayGroups[firstDay];
        const dayNames = dayOrder.filter(d => dayGroups[d]).map(d => d.slice(0, 3)).join(', ');
        lines.push(`${dayNames}: ${hours.map(h => `${h.start}-${h.end}`).join(', ')}`);
      }
    }

    return lines.join('\n') || "No availability";
  };

  const loadPatients = async () => {
    // For MVP, we'll need to create a simple patient list endpoint
    // This is a simplified version - in production you'd have proper search
    try {
      const response = await fetch("/api/patients?pageSize=100");
      console.log("Patient API response status:", response.status, response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch patients - HTTP", response.status, errorText);
        setPatients([]);
        return;
      }

      const data = await response.json();
      console.log("Patient API data:", data);
      
      // API returns { patients: [...], total, page, pageSize, totalPages }
      if (data && typeof data === 'object' && 'patients' in data && Array.isArray(data.patients)) {
        console.log("Setting patients from data.patients:", data.patients.length);
        setPatients(data.patients);
      } else if (Array.isArray(data)) {
        // Fallback for direct array response
        console.log("Setting patients from array:", data.length);
        setPatients(data);
      } else {
        console.error("Invalid patients data format:", data);
        setPatients([]);
      }
    } catch (error) {
      console.error("Failed to load patients:", error);
      setPatients([]);
    }
  };

  const onSubmit = async (data: any) => {
    console.log('onSubmit called with data:', data);
    console.log('Form errors:', form.formState.errors);
    
    try {
      // Combine appointmentDate and appointmentTime into scheduledAt
      const [hours, minutes] = data.appointmentTime.split(':').map(Number);
      console.log('Parsed time:', { hours, minutes });
      
      const scheduledAt = new Date(data.appointmentDate);
      scheduledAt.setHours(hours, minutes, 0, 0);
      console.log('Scheduled at:', scheduledAt);
      console.log('Scheduled at ISO:', scheduledAt.toISOString());
      console.log('Scheduled at day of week:', scheduledAt.getDay(), ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][scheduledAt.getDay()]);

      const formattedData = {
        patientId: data.patientId,
        providerId: data.providerId,
        scheduledAt: scheduledAt,
        duration: typeof data.duration === 'number' ? data.duration : parseInt(data.duration, 10),
        type: data.type,
        reason: data.reason,
        notes: data.notes || "",
      };
      
      console.log("Submitting appointment data:", formattedData);
      await createMutation.mutate(formattedData as CreateAppointmentInput);
    } catch (error) {
      console.error('Error in onSubmit:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Create New Appointment
          </DialogTitle>
          <DialogDescription>
            Schedule a new appointment for a patient
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Display */}
            {createMutation.state.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createMutation.state.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Patient Selection */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(patients) && patients.length > 0 ? (
                        patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.firstName} {patient.lastName}
                            {patient.dateOfBirth && ` - DOB: ${new Date(patient.dateOfBirth).toLocaleDateString()}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-patients" disabled>
                          No patients available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the patient for this appointment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Provider Selection */}
            <FormField
              control={form.control}
              name="providerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Load schedule when provider is selected
                      loadProviderSchedule(value);
                    }}
                    value={field.value}
                    disabled={userRole === "PROVIDER"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.isArray(providers) && providers.length > 0 ? (
                        providers.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.title} {provider.firstName} {provider.lastName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-providers" disabled>
                          No providers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {userRole === "PROVIDER"
                      ? "You can only create appointments for yourself"
                      : "Select the provider for this appointment"}
                  </FormDescription>
                  {providerSchedule && (
                    <div className="mt-2 rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm p-3 shadow-sm">
                      <p className="mb-1 text-sm font-medium text-[#7E22CE]">
                        Available Hours
                      </p>
                      <p className="whitespace-pre-line text-sm text-muted-foreground">
                        {providerSchedule}
                      </p>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time - Split into two fields */}
            <div className="space-y-4">
              {/* Date Picker */}
              <FormField
                control={form.control}
                name="appointmentDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Appointment Date *</FormLabel>
                    <Popover modal={true}>
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
                      <PopoverContent className="w-auto p-0 z-[100]" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Select appointment date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time and Duration Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Time Input */}
                <FormField
                  control={form.control}
                  name="appointmentTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time *</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="09:00"
                          maxLength={5}
                          {...field}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^0-9:]/g, '');
                            
                            // Auto-format as user types
                            if (value.length === 2 && !value.includes(':')) {
                              value = value + ':';
                            }
                            
                            field.onChange(value);
                          }}
                          onBlur={(e) => {
                            const value = e.target.value;
                            // Validate HH:MM format
                            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
                            if (value && !timeRegex.test(value)) {
                              // Try to fix common formats
                              const parts = value.split(':');
                              if (parts.length === 2) {
                                const hours = parseInt(parts[0]) || 0;
                                const minutes = parseInt(parts[1]) || 0;
                                if (hours <= 23 && minutes <= 59) {
                                  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
                                  field.onChange(formatted);
                                  return;
                                }
                              }
                            }
                            field.onBlur();
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        24-hour format (e.g., 09:00, 14:30)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Duration */}
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value?.toString() || "30"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Minutes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Appointment Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NEW_PATIENT">New Patient</SelectItem>
                      <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                      <SelectItem value="CONSULTATION">Consultation</SelectItem>
                      <SelectItem value="PROCEDURE">Procedure</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the reason for this appointment..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of why the patient is visiting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes or instructions..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional notes for internal use
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  createMutation.reset();
                }}
                disabled={createMutation.state.isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.state.isLoading}>
                {createMutation.state.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Appointment
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
