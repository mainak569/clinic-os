"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, UserX } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";

import { markNoShowSchema, type MarkNoShowInput } from "@/lib/validations/appointment";
import { markAppointmentNoShow } from "@/app/actions/appointment.actions";

interface NoShowDialogProps {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NoShowDialog({
  appointmentId,
  open,
  onOpenChange,
  onSuccess,
}: NoShowDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MarkNoShowInput>({
    resolver: zodResolver(markNoShowSchema),
    defaultValues: {
      appointmentId,
      notes: "",
    },
  });

  const onSubmit = async (data: MarkNoShowInput) => {
    setIsSubmitting(true);
    try {
      const result = await markAppointmentNoShow(data);
      if (result.success) {
        toast.success("Appointment marked as no-show");
        form.reset();
        onSuccess();
      } else {
        toast.error(result.error || "Failed to mark appointment as no-show");
      }
    } catch (error) {
      console.error("Error marking no-show:", error);
      toast.error("Failed to mark appointment as no-show");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-orange-600" />
            Mark as No-Show
          </DialogTitle>
          <DialogDescription>
            Mark this appointment as a no-show. This is typically done when a patient does not arrive for their scheduled appointment.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the no-show..."
                      className="resize-none min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Any additional context or notes about why the patient didn&apos;t show
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Mark as No-Show
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
