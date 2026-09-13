"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, User, Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@/lib/hooks/use-mutation";
import { toast } from "sonner";

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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { createPatientSchema } from "@/lib/validations/patient";
import { createPatient, updatePatient } from "@/app/actions/patient.actions";
import { cn } from "@/lib/utils";

interface CreateEditPatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient?: any;
  isEditMode: boolean;
  onSuccess: () => void;
}

export function CreateEditPatientDialog({
  open,
  onOpenChange,
  patient,
  isEditMode,
  onSuccess,
}: CreateEditPatientDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const createMutation = useMutation(
    async (data: any) => {
      const payload = { ...data, ...(isEditMode && { id: patient.id }) };
      return isEditMode ? await updatePatient(payload) : await createPatient(payload);
    },
    {
      onSuccess: () => {
        form.reset();
        onSuccess();
        onOpenChange(false);
      },
      successMessage: isEditMode ? "Patient updated successfully" : "Patient created successfully",
      errorMessage: (error) => error || `Failed to ${isEditMode ? "update" : "create"} patient`,
      retryCount: 2,
    }
  );

  const form = useForm({
    resolver: zodResolver(createPatientSchema) as any,
    defaultValues: {
      firstName: patient?.firstName || "",
      lastName: patient?.lastName || "",
      email: patient?.email || "",
      phone: patient?.phone || "",
      dateOfBirth: patient?.dateOfBirth ? new Date(patient.dateOfBirth) : undefined,
      address: patient?.address || "",
      city: patient?.city || "",
      state: patient?.state || "",
      zipCode: patient?.zipCode || "",
      emergencyContactName: patient?.emergencyContactName || "",
      emergencyContactPhone: patient?.emergencyContactPhone || "",
      insuranceProvider: patient?.insuranceProvider || "",
      insuranceId: patient?.insuranceId || "",
      allergies: patient?.allergies || "",
      medications: patient?.medications || "",
      medicalHistory: patient?.medicalHistory || "",
    },
  });

  // Map field names to their respective tabs
  const getTabForField = (fieldName: string): string => {
    const tabMapping: Record<string, string> = {
      firstName: "basic",
      lastName: "basic",
      dateOfBirth: "basic",
      email: "contact",
      phone: "contact",
      address: "contact",
      city: "contact",
      state: "contact",
      zipCode: "contact",
      emergencyContactName: "contact",
      emergencyContactPhone: "contact",
      insuranceProvider: "insurance",
      insuranceId: "insurance",
      allergies: "medical",
      medications: "medical",
      medicalHistory: "medical",
    };
    return tabMapping[fieldName] || "basic";
  };

  const onSubmit = async (data: any) => {
    await createMutation.mutate(data);
  };

  // Handle form submission with validation error detection
  const handleFormSubmit = form.handleSubmit(
    onSubmit,
    (errors) => {
      // Get the first error
      const firstErrorField = Object.keys(errors)[0] as keyof typeof errors;
      if (firstErrorField) {
        const errorTab = getTabForField(firstErrorField);
        const errorMessage = errors[firstErrorField]?.message as string;

        // Show toast notification
        toast.error("Validation Error", {
          description: errorMessage || `Please check the ${errorTab.charAt(0).toUpperCase() + errorTab.slice(1)} tab for required fields.`,
        });

        // Switch to the tab containing the error
        if (errorTab !== activeTab) {
          setActiveTab(errorTab);
        }
      }
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditMode ? "Edit Patient" : "Create New Patient"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update patient information below"
              : "Enter patient information to create a new record"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="insurance">Insurance</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date of Birth</FormLabel>
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
                              date > new Date() || date < new Date("1900-01-01")
                            }
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Patient&apos;s date of birth
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Contact Information Tab */}
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john.doe@example.com"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          At least email or phone required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormDescription>
                          At least email or phone required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="New York" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="NY" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input placeholder="10001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emergencyContactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="(555) 987-6543" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Insurance Information Tab */}
              <TabsContent value="insurance" className="space-y-4">
                <FormField
                  control={form.control}
                  name="insuranceProvider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance Provider</FormLabel>
                      <FormControl>
                        <Input placeholder="Blue Cross Blue Shield" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="insuranceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurance ID</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC123456789" {...field} />
                      </FormControl>
                      <FormDescription>
                        Member or policy number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Medical Information Tab */}
              <TabsContent value="medical" className="space-y-4">
                <FormField
                  control={form.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List any known allergies..."
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
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Medications</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="List current medications..."
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
                  name="medicalHistory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical History</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Relevant medical history..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            {/* Error Display */}
            {createMutation.state.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {createMutation.state.error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
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
                {isEditMode ? "Update Patient" : "Create Patient"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
