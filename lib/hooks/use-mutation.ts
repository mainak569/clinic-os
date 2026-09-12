import { useState, useCallback } from "react";
import { toast } from "sonner";

/**
 * Mutation State
 * Tracks loading, success, and error states for async operations
 */
export interface MutationState<T = unknown> {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: T | null;
}

/**
 * Mutation Options
 */
export interface MutationOptions<TData = unknown, TVariables = unknown> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: string, variables: TVariables) => void | Promise<void>;
  onSettled?: (data: TData | null, error: string | null, variables: TVariables) => void | Promise<void>;
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: string, variables: TVariables) => string);
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Mutation Result
 */
export interface MutationResult<TData = unknown, TVariables = unknown> {
  mutate: (variables: TVariables) => Promise<void>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
  state: MutationState<TData>;
}

/**
 * Custom hook for managing mutation state with loading, success, failure, and retry
 * 
 * @example
 * const createMutation = useMutation(createAppointment, {
 *   onSuccess: () => router.refresh(),
 *   successMessage: "Appointment created successfully",
 *   retryCount: 2,
 * });
 * 
 * // In component
 * <Button 
 *   onClick={() => createMutation.mutate(formData)}
 *   disabled={createMutation.state.isLoading}
 * >
 *   {createMutation.state.isLoading && <Loader2 className="animate-spin" />}
 *   Create
 * </Button>
 */
export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<{ success: boolean; data?: TData; error?: string }>,
  options: MutationOptions<TData, TVariables> = {}
): MutationResult<TData, TVariables> {
  const {
    onSuccess,
    onError,
    onSettled,
    successMessage,
    errorMessage,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<MutationState<TData>>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
  });

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      error: null,
      data: null,
    });
  }, []);

  const executeWithRetry = useCallback(
    async (variables: TVariables, attemptsLeft: number): Promise<TData> => {
      try {
        const result = await mutationFn(variables);

        if (result.success && result.data !== undefined) {
          return result.data;
        }
        // The server answered and said no. That is a decision, not a glitch:
        // retrying a rejected write can only repeat the rejection, or worse.
        throw new ActionRejectedError(result.error || "Operation failed");
      } catch (error) {
        // Retry only when the request itself failed to complete.
        if (
          attemptsLeft > 0 &&
          !(error instanceof ActionRejectedError) &&
          isRetriableError(error)
        ) {
          await sleep(retryDelay);
          return executeWithRetry(variables, attemptsLeft - 1);
        }

        // No more retries or non-retriable error
        throw error;
      }
    },
    [mutationFn, retryDelay]
  );

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        isError: false,
        error: null,
      }));

      try {
        const data = await executeWithRetry(variables, retryCount);

        setState({
          isLoading: false,
          isSuccess: true,
          isError: false,
          error: null,
          data,
        });

        // Success callback
        if (onSuccess) {
          await onSuccess(data, variables);
        }

        // Success toast
        if (successMessage) {
          const message = typeof successMessage === "function"
            ? successMessage(data, variables)
            : successMessage;
          toast.success(message);
        }

        // Settled callback
        if (onSettled) {
          await onSettled(data, null, variables);
        }

        return data;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "An error occurred";

        setState({
          isLoading: false,
          isSuccess: false,
          isError: true,
          error: errorMsg,
          data: null,
        });

        // Error callback
        if (onError) {
          await onError(errorMsg, variables);
        }

        // Error toast
        if (errorMessage) {
          const message = typeof errorMessage === "function"
            ? errorMessage(errorMsg, variables)
            : errorMessage;
          toast.error(message);
        } else {
          toast.error(errorMsg);
        }

        // Settled callback
        if (onSettled) {
          await onSettled(null, errorMsg, variables);
        }

        throw error;
      }
    },
    [executeWithRetry, retryCount, onSuccess, onError, onSettled, successMessage, errorMessage]
  );

  const mutate = useCallback(
    async (variables: TVariables): Promise<void> => {
      try {
        await mutateAsync(variables);
      } catch (error) {
        // Error already handled in mutateAsync
        console.error("Mutation error:", error);
      }
    },
    [mutateAsync]
  );

  return {
    mutate,
    mutateAsync,
    reset,
    state,
  };
}

/**
 * A server action that returned `{ success: false }`. Never retried.
 */
class ActionRejectedError extends Error {}

/**
 * Helper: Determines if an error is retriable
 *
 * Only transport failures qualify. Unknown errors are not retried: a request
 * that failed after the server committed a write would otherwise create it twice.
 */
function isRetriableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  
  // Network errors - retriable
  if (message.includes("network") || message.includes("timeout") || message.includes("fetch")) {
    return true;
  }

  // Server errors (5xx) - retriable
  if (message.includes("internal server error") || message.includes("service unavailable")) {
    return true;
  }

  // Business logic errors - not retriable
  if (
    message.includes("unauthorized") ||
    message.includes("not found") ||
    message.includes("conflict") ||
    message.includes("validation") ||
    message.includes("invalid")
  ) {
    return false;
  }

  // Default: not retriable
  return false;
}

/**
 * Helper: Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
