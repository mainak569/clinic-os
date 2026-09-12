# Quick Start Guide - Creating Your First Appointment

## Your Database is Already Seeded! ✅

The error you're seeing is because you're trying to book an appointment **outside provider availability hours**.

## Available Providers & Their Hours

### Dr. Sarah Smith (Family Medicine)
**Days:** Monday - Friday  
**Hours:**
- Morning: 9:00 AM - 12:00 PM
- Afternoon: 1:00 PM - 5:00 PM

### Dr. Michael Johnson (Internal Medicine)
**Days:** Monday - Thursday  
**Hours:**
- Morning: 8:00 AM - 12:00 PM  
- Afternoon: 1:00 PM - 4:00 PM

## Your Error Explained

You tried to book at: **07:46 AM on 07/09/2026**

**Problem:** 
- 7:46 AM is **before** Dr. Johnson's start time (8:00 AM)
- Dr. Smith doesn't start until 9:00 AM

## How to Create an Appointment Successfully

### Step 1: Login
Use these credentials:
```
Email: frontdesk@clinicos.com
Password: FrontDesk123!
```

### Step 2: Go to Appointments
Dashboard → Appointments → Click "New Appointment"

### Step 3: Fill the Form

**Patient:** Select any patient (e.g., "mainak das")

**Provider:** Select Dr. Michael Johnson

**Date & Time:** Choose a time that falls within their hours:

✅ **Good Examples:**
- Monday at 9:00 AM (Dr. Smith)
- Tuesday at 10:30 AM (Dr. Smith or Dr. Johnson)
- Wednesday at 2:00 PM (Dr. Smith or Dr. Johnson)
- Thursday at 11:00 AM (Dr. Smith or Dr. Johnson)
- Friday at 3:00 PM (Dr. Smith only)

❌ **Bad Examples:**
- Monday at 7:46 AM (before either doctor starts)
- Friday at 10:00 AM for Dr. Johnson (he doesn't work Fridays)
- Any day at 12:30 PM (lunch break - no availability)
- Any day at 6:00 PM (after hours)

**Duration:** 30 minutes

**Type:** Follow-up

**Reason:** "Regular checkup" (or any reason)

### Step 4: Click "Create Appointment"

It should work! ✅

## Quick Test

Try this exact combination right now:

1. **Provider:** Dr. Michael Johnson
2. **Date:** Next Monday
3. **Time:** 9:00 AM (change from 07:46 to 09:00)
4. **Duration:** 30 minutes

This will definitely work because:
- ✅ Monday is a working day for Dr. Johnson
- ✅ 9:00 AM is during his morning hours (8 AM - 12 PM)
- ✅ 30 minutes fits within the available slot

## Check Provider Availability

To see all available slots:

1. Go to **Dashboard → Schedule**
2. You'll see the calendar with availability

**List View** shows:
- Which days each provider works
- Their start/end times
- All configured slots

**Month View** shows:
- Available days highlighted
- Click a day to see time slots

## Demo Patients Available

Your database has 5 demo patients:
1. John Davis
2. Mary Wilson  
3. Robert Brown
4. Emily Chen
5. James Garcia
6. Mainak Das (the one you created)

## Common Mistakes

### ❌ "Provider not available" Error

**Causes:**
1. **Time too early** - Before provider's start time
2. **Time too late** - After provider's end time  
3. **Wrong day** - Dr. Johnson doesn't work Fridays
4. **Lunch break** - 12:00 PM - 1:00 PM (no slots)
5. **Already booked** - Someone else has that slot

### ✅ Solution

Pick a time within these windows:

**Dr. Smith (Sarah):**
```
Mon-Fri: 9:00 AM - 12:00 PM
Mon-Fri: 1:00 PM - 5:00 PM
```

**Dr. Johnson (Michael):**
```
Mon-Thu: 8:00 AM - 12:00 PM
Mon-Thu: 1:00 PM - 4:00 PM
```

## Testing Different Scenarios

### Scenario 1: Book Early Morning
**Provider:** Dr. Johnson (starts at 8 AM)  
**Time:** 8:30 AM on Wednesday  
**Result:** ✅ Should work

### Scenario 2: Book Afternoon
**Provider:** Dr. Smith  
**Time:** 2:00 PM on Friday  
**Result:** ✅ Should work

### Scenario 3: Book on Friday
**Provider:** Dr. Johnson  
**Time:** 10:00 AM on Friday  
**Result:** ❌ Error (Dr. Johnson doesn't work Fridays)

**Fix:** Change provider to Dr. Smith

### Scenario 4: Book During Lunch
**Provider:** Either  
**Time:** 12:30 PM  
**Result:** ❌ Error (lunch break - no availability slots)

**Fix:** Pick 1:00 PM or later

## View Existing Appointments

Dashboard → Appointments shows:
- Today's appointments
- Upcoming appointments  
- Past appointments

You'll see 5 demo appointments already in the system.

## Database Schema

Your database includes:

**Users (3):**
- frontdesk@clinicos.com (Front Desk)
- dr.smith@clinicos.com (Provider)
- dr.johnson@clinicos.com (Provider)

**Providers (2):**
- Dr. Sarah Smith
- Dr. Michael Johnson

**Patients (5):**
- Plus any you created (like Mainak Das)

**Availability Slots (18):**
- 10 slots for Dr. Smith (2 per weekday × 5 days)
- 8 slots for Dr. Johnson (2 per weekday × 4 days)

**Appointments (5):**
- Sample appointments with different statuses

## Need to Add More Availability?

If you want to add evening hours or weekend availability:

1. Go to **Dashboard → Schedule**
2. Click **"Add Availability"**
3. Fill in:
   - Provider: Dr. Smith
   - Day: Saturday
   - Start: 9:00 AM
   - End: 1:00 PM
   - Status: AVAILABLE
   - Recurring: Yes

Now you can book Saturday appointments!

## Summary

Your system is fully configured with:
- ✅ Users
- ✅ Providers  
- ✅ Patients
- ✅ **Availability Slots** (this is key!)
- ✅ Sample appointments

**To fix your error:**  
Just change the time from **7:46 AM** to **9:00 AM** (or any time within working hours).

That's it! Your appointment will be created successfully.

## Still Getting Errors?

If you still get "Provider not available" even with correct times:

1. **Check the day of week** - Make sure it matches provider's working days
2. **Refresh the page** - Clear any cached data
3. **Check the Schedule page** - Verify availability slots exist
4. **Check browser console** - Look for any JavaScript errors

## Next Steps

Once you successfully create an appointment, try:

1. **Confirm the appointment** (changes status to CONFIRMED)
2. **Check-in the patient** (marks them as arrived)
3. **Complete the appointment** (adds visit notes)
4. **View appointment timeline** (see history of changes)

Good luck! 🎉
