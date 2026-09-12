# Session User Validation Fix

## Problem

When creating an appointment, the system threw a database foreign key constraint error:

```
Invalid `prisma.appointmentHistory.create()` invocation: 
Foreign key constraint violated: `appointment_history_performed_by_fkey (index)`
```

### Root Cause

The `AppointmentHistory` table has a foreign key constraint on `performedBy` that references `User.id`. When an appointment is created, the system tries to create a history entry with the `performedBy` field set to the current user's ID from their session.

**The error occurs when:**
1. The database was reset/seeded during development
2. The user's session contains an old user ID that no longer exists in the database
3. The system tries to create a history entry referencing the non-existent user

This is a common development issue when:
- Running `npx prisma migrate reset`
- Running `npx prisma db push --force-reset`
- Manually deleting and recreating the database
- Switching between different database instances

## Solution

Implemented a two-layer defense:

### 1. Session Validation (Primary Fix)
**File:** `app/actions/appointment.actions.ts`

Before creating an appointment, validate that the session user actually exists in the database:

```typescript
// Validate that the session user actually exists in the database
const userExists = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { id: true },
});

if (!userExists) {
  return {
    success: false,
    error: "Your session is outdated. Please log out and log back in to continue.",
  };
}
```

**User Experience:**
- User sees a clear error message
- Instructions to log out and log back in
- Prevents the appointment creation from failing with a cryptic error

### 2. Graceful History Fallback (Secondary Fix)
**File:** `lib/services/appointment.service.ts`

Added validation in the `createHistoryEntry` method to verify the user exists before creating the history record:

```typescript
private async createHistoryEntry(...) {
  try {
    // Verify the user exists before creating history entry
    const userExists = await prisma.user.findUnique({
      where: { id: performedBy },
      select: { id: true },
    });

    if (!userExists) {
      console.error(`Cannot create appointment history: User ${performedBy} not found`);
      return; // Skip history creation but don't fail the operation
    }

    await prisma.appointmentHistory.create({ ... });
  } catch (error) {
    console.error('Failed to create appointment history:', error);
    // Log but don't fail the main operation
  }
}
```

**Benefits:**
- Appointment creation still succeeds even if history fails
- Logs the issue for debugging
- Prevents cascading failures

## How Users Should Handle This

When you see the error message:
> "Your session is outdated. Please log out and log back in to continue."

**Steps to fix:**
1. Click on your profile/user menu in the top right
2. Click "Sign Out"
3. Log back in with your credentials
4. Try creating the appointment again

## Prevention

To avoid this issue in development:

1. **After database resets:**
   ```bash
   npx prisma migrate reset  # or prisma db push --force-reset
   npx prisma db seed        # Re-seed the database
   ```

2. **Clear your browser session:**
   - Option A: Sign out and sign back in
   - Option B: Clear cookies for localhost:3000
   - Option C: Use incognito/private browsing

3. **Use consistent development workflow:**
   - Don't mix manual database deletions with active sessions
   - Always re-seed after resets
   - Test with fresh login after database changes

## Production Considerations

This issue is primarily a development problem. In production:

- Database rarely gets reset
- User sessions remain valid
- If it does occur, users get a clear error message to re-authenticate

## Alternative Solutions Considered

1. **Make performedBy optional:** Not chosen because audit trail requires knowing who performed actions
2. **Use a system user ID:** Could work but complicates audit trail
3. **Cascade delete users:** Bad idea - would delete all history
4. **Current approach:** Best balance of reliability and data integrity
