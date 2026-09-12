# Provider Schedule Selector Enhancement

## Problem
When front desk staff navigated to the Schedule page, they could only see and manage availability for the first provider alphabetically. There was no way to switch between providers.

## Solution
Added a provider selector dropdown for front desk users on the Schedule page.

### Changes Made

#### 1. Schedule Page (`app/dashboard/schedule/page.tsx`)
- Added query parameter support (`?provider=<providerId>`)
- Front desk users can now select which provider's schedule to manage
- Provider users still see only their own schedule (no selector shown)

#### 2. New Component: `SchedulePageClient` 
**File**: `components/schedule/schedule-page-client.tsx`

A client-side component that displays:
- Provider selector dropdown (shows all providers)
- Current provider name being managed
- The schedule calendar for the selected provider

**Features:**
- Dropdown lists all providers by name
- Changes URL query parameter when provider is selected
- Shows clear indication of which provider is being managed
- Only shown to FRONT_DESK role users

### User Experience

#### For Front Desk Staff:
1. Navigate to Schedule page
2. See dropdown with all providers listed
3. Select a provider from the dropdown
4. Schedule calendar updates to show that provider's availability
5. Can create/edit/delete availability slots for the selected provider
6. URL updates to reflect selected provider (can bookmark or share links)

#### For Provider Users:
- No change - they only see their own schedule
- No provider selector is shown (they can't manage other providers' schedules)

### Technical Details

**Authorization:**
- Front desk can access any provider's schedule
- Providers can only access their own schedule (enforced server-side)

**State Management:**
- Selected provider ID stored in URL query parameter
- Allows for:
  - Bookmarking specific provider schedules
  - Sharing links to specific provider schedules
  - Browser back/forward navigation works correctly

**Component Structure:**
```
SchedulePage (Server Component)
├─ Checks user role
├─ Fetches providers list (if FRONT_DESK)
├─ Determines which provider to show
└─ Renders appropriate view:
   ├─ SchedulePageClient (for FRONT_DESK) - with selector
   └─ ScheduleCalendar directly (for PROVIDER) - without selector
```

## Benefits

1. **Clear Provider Context**: Front desk always knows which provider they're managing
2. **Flexible Management**: Can quickly switch between providers
3. **Better UX**: No confusion about whose schedule is being modified
4. **Scalable**: Works with any number of providers
5. **Bookmarkable**: Can save direct links to specific provider schedules

## Future Enhancements

Potential improvements for the future:
- Multi-provider bulk operations (set same schedule for multiple providers at once)
- Provider availability comparison view (see all providers side-by-side)
- Copy schedule from one provider to another
- Provider groups or teams for easier management
