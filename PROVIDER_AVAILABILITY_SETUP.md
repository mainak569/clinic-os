# Provider Availability Setup Guide

## Error Message

If you see this error when creating an appointment:

> "Provider is not available at the requested time. Please go to the Schedule page to set up provider availability first, or choose a time that matches existing availability slots."

This means the provider doesn't have availability configured for the date/time you selected.

## Why This Happens

ClinicOS prevents double-booking by checking if:
1. The provider has availability slots configured
2. The requested time falls within an available slot
3. The time slot isn't already booked by another appointment

This is a **security feature** to ensure proper scheduling and prevent conflicts.

## Solution: Set Up Provider Availability

### Step 1: Navigate to Schedule Page

1. Login as **Front Desk** or the **Provider**
2. Go to **Dashboard → Schedule**

### Step 2: Create Availability Slot

Click "Add Availability" and fill in:

**Required Fields:**
- **Day of Week**: Select the day (e.g., Monday, Tuesday, etc.)
- **Start Time**: When the provider starts working (e.g., 09:00 AM)
- **End Time**: When the provider stops seeing patients (e.g., 05:00 PM)
- **Status**: Set to "AVAILABLE"

**Optional Fields:**
- **Recurring**: Check this to repeat weekly
- **Effective From**: Start date for this availability
- **Effective Until**: End date (leave blank for indefinite)

**Example:**
```
Day: Monday
Start Time: 09:00 AM
End Time: 05:00 PM
Recurring: Yes
Status: AVAILABLE
```

### Step 3: Create Appointment

Once availability is set up, you can create appointments during those hours.

## Bulk Availability Setup

For setting up availability for multiple days at once:

1. Go to **Dashboard → Schedule**
2. Click **"Bulk Add Availability"**
3. Select multiple days of the week
4. Set start/end times
5. Click "Create Availability Slots"

This will create availability for all selected days at once.

## Check Existing Availability

**List View:**
- Shows availability grouped by day of week
- Displays all configured slots

**Month View:**
- Calendar view showing available days
- Click on a day to see time slots

## Demo Data

If you ran the seed script (`npm run db:seed`), providers should already have availability:

**Dr. Emma Smith:**
- Monday-Friday: 9:00 AM - 5:00 PM

**Dr. Michael Johnson:**
- Monday-Friday: 10:00 AM - 6:00 PM

If you don't see availability, the database might not be seeded.

## Troubleshooting

### Issue: "Provider is not available" even after creating availability

**Check:**
1. **Correct Provider**: Make sure you created availability for the right provider
2. **Correct Day**: Availability must be on the same day of week
3. **Time Range**: Appointment time must fall within start/end time
4. **Status**: Availability status must be "AVAILABLE" (not "BUSY" or "OFF")
5. **Date Range**: Check "Effective From/Until" dates

### Issue: Can't create availability (no providers shown)

**Solution:** 
- Login as Front Desk (can manage all providers)
- Or login as the Provider (can only manage their own)

### Issue: Time slot shown but still getting error

**Possible Causes:**
1. **Scheduling Conflict**: Another appointment already booked
2. **Duration Exceeds Availability**: 60-minute appointment but only 30 minutes left
3. **Buffer Time**: Some systems add buffer between appointments

## Technical Details

### Availability Check Logic

```typescript
// From lib/services/availability.service.ts
async isProviderAvailable(
  providerId: string,
  requestedTime: Date,
  durationMinutes: number
): Promise<boolean>
```

This checks:
1. Does an availability slot exist for this day/time?
2. Is the status "AVAILABLE"?
3. Does the entire appointment fit within the slot?
4. Is it within the effective date range?

### Database Schema

```prisma
model Availability {
  id             String
  providerId     String
  dayOfWeek      DayOfWeek  // MONDAY, TUESDAY, etc.
  startTime      DateTime
  endTime        DateTime
  status         AvailabilityStatus  // AVAILABLE, BUSY, OFF
  isRecurring    Boolean
  effectiveFrom  DateTime?
  effectiveUntil DateTime?
}
```

## Appointment Creation Flow

```
1. User selects provider + date/time
2. System checks: Does provider have availability?
   ├─ No → Show error ❌
   └─ Yes → Continue
3. System checks: Is there a scheduling conflict?
   ├─ Yes → Show error ❌
   └─ No → Create appointment ✅
```

## Best Practices

### 1. Set Up Availability Before Opening Bookings
Configure provider schedules before allowing patients to book.

### 2. Use Recurring Availability
Enable "Recurring" for regular weekly schedules to avoid creating slots manually each week.

### 3. Block Time for Breaks
Create "BUSY" availability slots for lunch breaks and meetings:
```
Day: Monday-Friday
Start: 12:00 PM
End: 1:00 PM
Status: BUSY
```

### 4. Handle Holidays
Create "OFF" availability for holidays:
```
Day: Thursday (Thanksgiving)
Effective From: 11/28/2024
Effective Until: 11/28/2024
Status: OFF
```

### 5. Update in Advance
Update availability at least 24-48 hours before changes take effect.

## API Endpoints

### Get Provider Availability
```
GET /api/providers/{providerId}
```

Returns provider details including availability slots.

### Create Availability
```
POST /api/availability
```

Body:
```json
{
  "providerId": "uuid",
  "dayOfWeek": "MONDAY",
  "startTime": "2024-01-01T09:00:00Z",
  "endTime": "2024-01-01T17:00:00Z",
  "status": "AVAILABLE",
  "isRecurring": true
}
```

## Related Files

- `/lib/services/availability.service.ts` - Availability logic
- `/lib/services/appointment.service.ts` - Appointment creation with availability check
- `/components/schedule/create-availability-dialog.tsx` - UI for creating availability
- `/app/dashboard/schedule/page.tsx` - Schedule management page

## Quick Fix for Testing

If you just want to test appointment creation **without setting up availability properly**, you can temporarily modify the check:

**⚠️ NOT RECOMMENDED FOR PRODUCTION**

Comment out the availability check in `lib/services/appointment.service.ts`:

```typescript
// TEMPORARILY DISABLED FOR TESTING
// const isAvailable = await availabilityService.isProviderAvailable(
//   input.providerId,
//   input.scheduledAt,
//   input.duration
// );
// if (!isAvailable) {
//   throw new Error("...");
// }
```

Remember to **re-enable** this before going to production!

## Summary

The error "Provider is not available at the requested time" is **working as designed**. It's a business rule that ensures:

✅ Appointments are only scheduled during provider's working hours  
✅ No double-booking  
✅ No appointments outside configured availability  
✅ Proper schedule management

**To fix:** Create availability slots for the provider on the Schedule page before creating appointments.
