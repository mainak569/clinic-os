"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertTriangle, AlertCircle } from "lucide-react";
import { useMutation } from "@/lib/hooks/use-mutation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Alert, AlertDescription } from "@/components/ui/alert";

import { cancelAppointmentSchema, type CancelAppointmentInput } from "@/lib/validations/appointment";
import { cancelAppointment } from "@/app/actions/appointment.actions";

interface CancelAppointmentDialogProps {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CancelAppointmentDialog({
  appointmentId,
  open,
  onOpenChange,
  onSuccess,
}: CancelAppointmentDialogProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const cancelMutation = useMutation(cancelAppointment, {
    onSuccess: () => {
      form.reset();
      setShowConfirm(false);
      onSuccess();
      onOpenChange(false);
    },
    successMessage: "Appointment cancelled successfully",
    errorMessage: (error) => error || "Failed to cancel appointment",
    retryCount: 2,
  });

  const form = useForm<CancelAppointmentInput>({
    resolver: zodResolver(cancelAppointmentSchema),
    defaultValues: {
      appointmentId,
      cancellationReason: "",
    },
  });

  const onSubmit = async () => {
    setShowConfirm(true);
  };

  const handleConfirmedCancel = async () => {
    const data = form.getValues();
    await cancelMutation.mutate(data);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel Appointment
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for cancelling this appointment. This action will update the appointment status and notify relevant parties.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Error Display */}
              {cancelMutation.state.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {cancelMutation.state.error}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="cancellationReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cancellation Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the reason for cancellation..."
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will be recorded in the appointment history
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    cancelMutation.reset();
                  }}
                  disabled={cancelMutation.state.isLoading}
                >
                  Go Back
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={cancelMutation.state.isLoading}
                >
                  {cancelMutation.state.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cancel Appointment
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently cancel this appointment. The cancellation will be recorded in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.state.isLoading}>
              No, go back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedCancel}
              disabled={cancelMutation.state.isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelMutation.state.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, cancel appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
