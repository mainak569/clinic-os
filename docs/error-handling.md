# Error Handling & Mutation Management

## Overview

All mutations in the application follow a consistent pattern for handling loading, success, failure, and retry/recovery states using the `useMutation` hook.

## Architecture

### Core Hook: `useMutation`

Location: `/lib/hooks/use-mutation.ts`

The `useMutation` hook provides a unified interface for handling async operations with automatic error handling, retry logic, and state management.

### Key Features

1. **Loading State**: Tracks when mutation is in progress
2. **Success State**: Indicates successful completion
3. **Error State**: Captures and displays errors
4. **Retry Logic**: Automatic retry for retriable errors
5. **Toast Notifications**: Automatic success/error toasts
6. **Callbacks**: `onSuccess`, `onError`, `onSettled`

## Usage Pattern

### Basic Example

```typescript
import { useMutation } from "@/lib/hooks/use-mutation";
import { createAppointment } from "@/app/actions/appointment.actions";

function MyComponent() {
  const createMutation = useMutation(createAppointment, {
    onSuccess: () => {
      // Refresh data, close dialog, etc.
      router.refresh();
    },
    successMessage: "Appointment created successfully",
    errorMessage: (error) => error || "Failed to create appointment",
    retryCount: 2, // Retry up to 2 times on failure
  });

  const handleSubmit = async (data) => {
    await createMutation.mutate(data);
  };

  return (
    <>
      {createMutation.state.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {createMutation.state.error}
          </AlertDescription>
        </Alert>
      )}

      <Button 
        onClick={() => handleSubmit(formData)}
        disabled={createMutation.state.isLoading}
      >
        {createMutation.state.isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Submit
      </Button>
    </>
  );
}
```

### Advanced Example with Dynamic Messages

```typescript
const updateMutation = useMutation(updatePatient, {
  successMessage: (data, variables) => 
    `Patient ${data.firstName} ${data.lastName} updated successfully`,
  errorMessage: (error, variables) => 
    `Failed to update patient ${variables.id}: ${error}`,
  onSuccess: (data) => {
    console.log("Updated patient:", data);
    router.push(`/patients/${data.id}`);
  },
  onError: (error) => {
    console.error("Update failed:", error);
    // Additional error handling logic
  },
  onSettled: (data, error) => {
    // Cleanup regardless of success or failure
    setDialogOpen(false);
  },
  retryCount: 3,
  retryDelay: 1000, // 1 second between retries
});
```

## Mutation State Interface

```typescript
interface MutationState<T> {
  isLoading: boolean;  // True while mutation is executing
  isSuccess: boolean;  // True after successful completion
  isError: boolean;    // True if mutation failed
  error: string | null; // Error message if failed
  data: T | null;      // Result data if successful
}
```

## Mutation Methods

### `mutate(variables)`
Fire-and-forget mutation. Returns void. Errors are handled internally and displayed via toasts.

```typescript
createMutation.mutate(formData); // No need to await
```

### `mutateAsync(variables)`
Returns a promise. Use when you need to chain operations or handle errors manually.

```typescript
try {
  const result = await createMutation.mutateAsync(formData);
  console.log("Success:", result);
} catch (error) {
  console.error("Failed:", error);
}
```

### `reset()`
Clears mutation state. Call when closing dialogs or resetting forms.

```typescript
const handleCancel = () => {
  createMutation.reset();
  onClose();
};
```

## Retry Logic

### Automatic Retry Conditions

The hook automatically retries mutations for:
- Network errors
- Timeout errors
- Server errors (5xx)
- Generic fetch failures

### Non-Retriable Errors

The following errors will NOT be retried:
- Authorization errors (401, 403)
- Not found errors (404)
- Conflict errors (409)
- Validation errors (400)
- Business logic errors

### Configuring Retries

```typescript
const mutation = useMutation(myAction, {
  retryCount: 3,        // Retry up to 3 times
  retryDelay: 2000,     // Wait 2 seconds between retries
});
```

## Error Display Patterns

### Inline Error Display

```tsx
{mutation.state.isError && (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      {mutation.state.error}
    </AlertDescription>
  </Alert>
)}
```

### Form-Level Error

```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {mutation.state.isError && (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {mutation.state.error}
        </AlertDescription>
      </Alert>
    )}
    
    {/* Form fields */}
  </form>
</Form>
```

### Toast-Only Errors

```typescript
// Errors are automatically shown as toasts
const mutation = useMutation(myAction, {
  errorMessage: "Failed to complete operation",
});

// No need for inline error display
```

## Button State Management

### Submit Button with Loading State

```tsx
<Button 
  type="submit" 
  disabled={mutation.state.isLoading}
>
  {mutation.state.isLoading && (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  )}
  {mutation.state.isLoading ? "Processing..." : "Submit"}
</Button>
```

### Cancel Button

```tsx
<Button
  type="button"
  variant="outline"
  onClick={() => {
    onOpenChange(false);
    mutation.reset(); // Clear error state
  }}
  disabled={mutation.state.isLoading}
>
  Cancel
</Button>
```

## Server Action Return Type

All server actions must return this structure:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

Example:

```typescript
export async function createAppointment(input: CreateAppointmentInput): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();
    const appointment = await appointmentService.createAppointment(input, session.user.id);
    
    return { success: true, data: { id: appointment.id } };
  } catch (error) {
    console.error("createAppointment error:", error);
    
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    
    return { success: false, error: "Failed to create appointment" };
  }
}
```

## Components Updated with Error Handling

The following components have been updated to use the `useMutation` hook:

1. **Appointments**
   - `create-appointment-dialog.tsx` - Creating appointments
   - `cancel-appointment-dialog.tsx` - Cancelling appointments

2. **Patients**
   - `create-edit-patient-dialog.tsx` - Creating/editing patients

3. **Schedule** (To be updated)
   - `create-availability-dialog.tsx`
   - `edit-availability-dialog.tsx`

4. **Visit Notes** (To be updated)
   - `visit-note-form.tsx`

5. **Authentication** (To be updated)
   - `login-form.tsx`

## Testing Mutations

### Test Loading State

```typescript
it("should show loading state during mutation", async () => {
  render(<MyComponent />);
  
  const button = screen.getByRole("button", { name: /submit/i });
  fireEvent.click(button);
  
  expect(button).toBeDisabled();
  expect(screen.getByRole("status")).toBeInTheDocument(); // Loading spinner
});
```

### Test Success State

```typescript
it("should call onSuccess after successful mutation", async () => {
  const onSuccess = jest.fn();
  const mutation = useMutation(mockAction, { onSuccess });
  
  await mutation.mutateAsync(testData);
  
  expect(onSuccess).toHaveBeenCalledWith(expectedData, testData);
});
```

### Test Error State

```typescript
it("should display error message on failure", async () => {
  const mockAction = jest.fn().mockResolvedValue({
    success: false,
    error: "Test error message",
  });
  
  render(<MyComponent action={mockAction} />);
  
  fireEvent.click(screen.getByRole("button", { name: /submit/i }));
  
  await waitFor(() => {
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });
});
```

### Test Retry Logic

```typescript
it("should retry failed mutations", async () => {
  const mockAction = jest.fn()
    .mockResolvedValueOnce({ success: false, error: "Network error" })
    .mockResolvedValueOnce({ success: false, error: "Network error" })
    .mockResolvedValueOnce({ success: true, data: { id: "123" } });
  
  const mutation = useMutation(mockAction, { retryCount: 2 });
  
  await mutation.mutateAsync(testData);
  
  expect(mockAction).toHaveBeenCalledTimes(3);
  expect(mutation.state.isSuccess).toBe(true);
});
```

## Best Practices

### 1. Always Reset on Dialog Close

```typescript
const handleClose = () => {
  mutation.reset();
  onOpenChange(false);
};
```

### 2. Disable Actions During Loading

```typescript
<DialogContent>
  {/* Content */}
  <Button disabled={mutation.state.isLoading}>Submit</Button>
</DialogContent>
```

### 3. Provide Meaningful Error Messages

```typescript
const mutation = useMutation(createPatient, {
  errorMessage: (error) => {
    if (error.includes("duplicate email")) {
      return "A patient with this email already exists";
    }
    return error || "Failed to create patient";
  },
});
```

### 4. Use Optimistic Updates for Better UX

```typescript
const mutation = useMutation(updateStatus, {
  onMutate: (variables) => {
    // Optimistically update UI
    queryClient.setQueryData(["appointment", variables.id], (old) => ({
      ...old,
      status: variables.status,
    }));
  },
  onError: (error, variables, context) => {
    // Rollback on error
    queryClient.invalidateQueries(["appointment", variables.id]);
  },
});
```

### 5. Clean Up on Success

```typescript
const mutation = useMutation(createItem, {
  onSuccess: () => {
    form.reset();
    queryClient.invalidateQueries(["items"]);
    router.refresh();
  },
});
```

## Troubleshooting

### Mutation Not Firing

Check that:
1. The server action returns the correct `ActionResult` type
2. The mutation is called with `await` or `.mutate()`
3. Form validation is passing

### Errors Not Displaying

Check that:
1. Error state is checked: `mutation.state.isError`
2. Error message is rendered: `mutation.state.error`
3. Alert component is visible in the DOM

### Retry Not Working

Check that:
1. Error is retriable (not a 4xx client error)
2. `retryCount` is set > 0
3. Error message doesn't indicate a non-retriable condition

### Toasts Not Showing

Check that:
1. `sonner` Toaster is mounted in the app
2. `successMessage` or `errorMessage` is provided
3. No conflicting toast calls in callbacks

## Migration Checklist

To migrate an existing component to use `useMutation`:

- [ ] Import `useMutation` from `@/lib/hooks/use-mutation`
- [ ] Replace `useState(isLoading)` with mutation state
- [ ] Remove manual try/catch blocks
- [ ] Remove manual toast calls
- [ ] Add error display component
- [ ] Update button disabled states
- [ ] Add mutation.reset() to cancel handlers
- [ ] Configure retry count if needed
- [ ] Test loading, success, error, and retry flows
- [ ] Update tests to use mutation state

## Future Enhancements

Potential improvements to the mutation system:

1. **Optimistic Updates**: Built-in support for optimistic UI updates
2. **Mutation Queue**: Queue mutations when offline, sync when online
3. **Debouncing**: Prevent duplicate submissions
4. **Progress Tracking**: For long-running operations
5. **Cancellation**: Ability to cancel in-flight mutations
6. **Global Error Handler**: Centralized error logging/reporting
