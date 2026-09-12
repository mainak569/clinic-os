import { ZodError } from "zod";

/**
 * The message a server action returns when it fails.
 *
 * Actions used to return `error.message` for everything. For a ZodError that
 * message is a JSON dump of every issue, so a single bad field reached the
 * user as a wall of brackets. Validation failures now return the first issue's
 * own message.
 */
export function actionErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  if (error instanceof Error) {
    // requireRole() redirects unauthorised users; inside an action that
    // surfaces as a thrown NEXT_REDIRECT rather than a navigation.
    if (error.message === "NEXT_REDIRECT") {
      return "You don't have permission to do that.";
    }
    return error.message || fallback;
  }
  return fallback;
}
