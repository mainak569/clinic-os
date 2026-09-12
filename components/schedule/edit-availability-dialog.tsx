"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { slotDateToTimeString } from "@/lib/clinic-time";
import { Clock, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateAvailabilitySlot,
  archiveAvailabilitySlot,
  restoreAvailabilitySlot,
  deleteAvailabilitySlot,
} from "@/app/actions/availability.actions";
import type { AvailabilitySlot } from "./schedule-calendar";

const formSchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

type FormValues = z.infer<typeof formSchema>;

interface EditAvailabilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: AvailabilitySlot;
  onSuccess: () => void;
}

const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

export function EditAvailabilityDialog({
  open,
  onOpenChange,
  slot,
  onSuccess,
}: EditAvailabilityDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dayOfWeek: slot.dayOfWeek as any,
      startTime: slotDateToTimeString(slot.startTime),
      endTime: slotDateToTimeString(slot.endTime),
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);

    try {
      if (values.endTime <= values.startTime) {
        toast.error("End time must be after start time");
        setIsSubmitting(false);
        return;
      }

      const result = await updateAvailabilitySlot({
        slotId: slot.id,
        dayOfWeek: values.dayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
      });

      if (result.success) {
        toast.success("Availability slot updated");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Failed to update availability slot:", error);
      toast.error("Failed to update availability slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    setIsSubmitting(true);
    try {
      const result = await archiveAvailabilitySlot({ slotId: slot.id });
      if (result.success) {
        toast.success("Availability slot archived");
        setShowArchiveDialog(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Failed to archive slot:", error);
      toast.error("Failed to archive slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    try {
      const result = await restoreAvailabilitySlot({ slotId: slot.id });
      if (result.success) {
        toast.success("Availability slot restored");
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Failed to restore slot:", error);
      toast.error("Failed to restore slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const result = await deleteAvailabilitySlot({ slotId: slot.id });
      if (result.success) {
        toast.success("Availability slot permanently deleted");
        setShowDeleteDialog(false);
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Failed to delete slot:", error);
      toast.error("Failed to delete slot");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Edit Availability Slot</DialogTitle>
              <Badge variant={slot.isActive ? "default" : "secondary"}>
                {slot.isActive ? "Active" : "Archived"}
              </Badge>
            </div>
            <DialogDescription>
              Modify the recurring weekly time slot
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Day of Week</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!slot.isActive}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a day" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          <Input
                            type="time"
                            {...field}
                            disabled={!slot.isActive}
                          />
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
                          <Input
                            type="time"
                            {...field}
                            disabled={!slot.isActive}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  {slot.isActive ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowArchiveDialog(true)}
                      disabled={isSubmitting}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Archive
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleRestore}
                      disabled={isSubmitting}
                    >
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isSubmitting}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>

                <div className="flex gap-2 sm:ml-auto">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !slot.isActive}
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Availability Slot?</AlertDialogTitle>
            <AlertDialogDescription>
              This slot will be archived and will no longer be available for
              booking. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive Slot
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Slot?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-destructive">
                    This action cannot be undone.
                  </span>
                  {" "}The availability slot will be permanently removed from the database.
                </p>
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/70 backdrop-blur-sm p-3 text-sm">
                  <strong>Recommendation:</strong> Use Archive instead to preserve data.
                  Archive hides the slot but keeps it in the database for records.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Permanently Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
