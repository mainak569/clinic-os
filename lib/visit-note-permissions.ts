/**
 * Whether the current user may write (create or edit) the visit note for an
 * appointment. Mirrors the server rule in app/actions/visit-note.actions.ts:
 * only the appointment's own provider documents it. The server still enforces
 * this on save; the UI uses it to decide whether to show the form.
 */
export function canWriteVisitNote(
  userRole: string,
  userProviderId: string | null | undefined,
  appointmentProviderId: string
): boolean {
  return (
    userRole === "PROVIDER" &&
    !!userProviderId &&
    userProviderId === appointmentProviderId
  );
}
