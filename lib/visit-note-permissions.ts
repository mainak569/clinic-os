/** Appointment statuses a visit note can be written for: the patient has arrived. */
export const VISIT_NOTE_STATUSES = ["CHECKED_IN", "COMPLETED"];

/**
 * Whether the current user may write (create or edit) the visit note for an
 * appointment. Mirrors the server rules in app/actions/visit-note.actions.ts
 * and the visit-note service: only the appointment's own provider documents
 * it, and only once the patient has checked in. The server still enforces this
 * on save; the UI uses it to decide whether to show the form.
 */
export function canWriteVisitNote(
  userRole: string,
  userProviderId: string | null | undefined,
  appointmentProviderId: string,
  appointmentStatus?: string
): boolean {
  return (
    userRole === "PROVIDER" &&
    !!userProviderId &&
    userProviderId === appointmentProviderId &&
    (appointmentStatus === undefined ||
      VISIT_NOTE_STATUSES.includes(appointmentStatus))
  );
}
