"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Stethoscope } from "lucide-react";
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
import { createProvider, updateProvider } from "@/app/actions/provider.actions";
import { createProviderSchema, updateProviderSchema } from "@/lib/validations/provider";

interface ProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The provider to edit; omit to add a new one. */
  provider?: any | null;
  onSuccess: () => void;
}

function defaults(provider?: any | null) {
  return {
    ...(provider ? { id: provider.id } : {}),
    title: provider?.title ?? "",
    firstName: provider?.firstName ?? "",
    lastName: provider?.lastName ?? "",
    email: provider?.user?.email ?? "",
    password: "",
    profile: {
      specialization: provider?.profile?.specialization ?? "",
      licenseNumber: provider?.profile?.licenseNumber ?? "",
      phone: provider?.profile?.phone ?? "",
      officeLocation: provider?.profile?.officeLocation ?? "",
      bio: provider?.profile?.bio ?? "",
      appointmentLength: provider?.profile?.appointmentLength ?? 30,
      bufferTime: provider?.profile?.bufferTime ?? 15,
    },
  };
}

const minutesField = (onChange: (v: number | undefined) => void) =>
  (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value === "" ? undefined : e.target.valueAsNumber);

export function ProviderFormDialog({
  open,
  onOpenChange,
  provider,
  onSuccess,
}: ProviderFormDialogProps) {
  const isEdit = Boolean(provider);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The parent keys this component by provider id, so the resolver and
  // defaults are fixed for the lifetime of one form.
  const form = useForm<any>({
    resolver: zodResolver(isEdit ? updateProviderSchema : createProviderSchema) as any,
    defaultValues: defaults(provider),
  });

  const onSubmit = async (values: any) => {
    setIsSubmitting(true);
    const result = isEdit ? await updateProvider(values) : await createProvider(values);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(isEdit ? "Provider updated" : "Provider added");
      form.reset(defaults(null));
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            {isEdit ? "Edit Provider" : "Add Provider"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this provider's details. Leave the password blank to keep the current one."
              : "Creates the provider and their sign-in. Share the email and password with them securely."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Identity */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Identity</h3>
              <div className="grid gap-4 sm:grid-cols-[6rem_1fr_1fr]">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Sarah" {...field} />
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
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Sign-in */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Sign-in</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" autoComplete="off" placeholder="dr.smith@clinicos.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isEdit ? "New Password" : "Password *"}</FormLabel>
                      <FormControl>
                        <Input type="password" autoComplete="new-password" placeholder="At least 8 characters" {...field} />
                      </FormControl>
                      {isEdit && <FormDescription>Leave blank to keep the current password.</FormDescription>}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Profile */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold">Profile</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="profile.specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input placeholder="Family Medicine" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profile.licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="MD123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profile.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profile.officeLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Building A, Room 101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profile.appointmentLength"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Visit Length (min) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={15}
                          max={240}
                          step={5}
                          value={field.value ?? ""}
                          onChange={minutesField(field.onChange)}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profile.bufferTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buffer Between Visits (min) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={120}
                          step={5}
                          value={field.value ?? ""}
                          onChange={minutesField(field.onChange)}
                          onBlur={field.onBlur}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="profile.bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Short professional summary..." className="min-h-[80px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="flex justify-end gap-3 border-t border-white/60 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? "Save Changes" : "Add Provider"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
