# ClinicOS Appointment Domain - Quick Start Guide

## ✅ Implementation Complete

The appointment domain backend is fully implemented with clean architecture, state machine validation, and comprehensive business rules.

---

## 📁 Project Structure

```
app/
  actions/
    appointment.actions.ts     # 383 lines - Appointment server actions
    availability.actions.ts    # 222 lines - Availability server actions

lib/
  services/
    appointment.service.ts     # 341 lines - Appointment business logic
    availability.service.ts    # 229 lines - Availability business logic
  validations/
    appointment.ts             # 70 lines - Appointment Zod schemas
    availability.ts            # 50 lines - Availability Zod schemas
  errors/
    appointment-errors.ts      # 61 lines - Custom error classes
  auth-helpers.ts              # Pre-existing - Authorization utilities

docs/
  appointment-domain-architecture.md    # Complete architecture guide
  appointment-api-reference.md          # Full API documentation
  IMPLEMENTATION_SUMMARY.md             # Detailed summary
  QUICK_START.md                        # This file
```

**Total: ~1,356 lines of production-ready code**

---

## 🚀 Quick Usage Examples

### 1. Create an Appointment

```typescript
import { createAppointment } from '@/app/actions/appointment.actions';

const result = await createAppointment({
  patientId: 'patient_123',
  providerId: 'provider_456',
  scheduledAt: new Date('2026-09-15T10:00:00'),
  duration: 30,
  type: 'FOLLOW_UP',
  reason: 'Regular checkup',
  notes: 'Patient prefers morning appointments',
});

if (result.success) {
  console.log('Appointment created:', result.data.id);
} else {
  console.error('Error:', result.error);
}
```

### 2. Progress Through States

```typescript
import {
  confirmAppointment,
  checkInAppointment,
  completeAppointment,
} from '@/app/actions/appointment.actions';

// REQUESTED → CONFIRMED
await confirmAppointment({ appointmentId });

// CONFIRMED → CHECKED_IN
await checkInAppointment({ appointmentId });

// CHECKED_IN → COMPLETED
await completeAppointment({ appointmentId });
```

### 3. Handle No-Show

```typescript
import { markAppointmentNoShow } from '@/app/actions/appointment.actions';

// Can only mark NO_SHOW from CONFIRMED status
// Can only mark NO_SHOW after scheduled time
const result = await markAppointmentNoShow({
  appointmentId: 'appt_123',
  notes: 'Patient did not arrive',
});
```

### 4. Cancel Appointment

```typescript
import { cancelAppointment } from '@/app/actions/appointment.actions';

// Can cancel before CHECKED_IN
// Requires cancellation reason
const result = await cancelAppointment({
  appointmentId: 'appt_123',
  cancellationReason: 'Patient requested reschedule',
});
```

### 5. Create Availability Slot

```typescript
import { createAvailabilitySlot } from '@/app/actions/availability.actions';

// Create Monday 9 AM - 5 PM slot
const result = await createAvailabilitySlot({
  providerId: 'provider_456',
  dayOfWeek: 'MONDAY',
  startTime: new Date('2024-01-01T09:00:00'),
  endTime: new Date('2024-01-01T17:00:00'),
});
```

---

## 🎯 State Machine Reference

### Valid Transitions

```
REQUESTED
  ├─> CONFIRMED (confirmAppointment)
  └─> CANCELLED (cancelAppointment)

CONFIRMED
  ├─> CHECKED_IN (checkInAppointment)
  ├─> NO_SHOW (markAppointmentNoShow, only after scheduled time)
  └─> CANCELLED (cancelAppointment)

CHECKED_IN
  ├─> COMPLETED (completeAppointment)
  └─> CANCELLED (cancelAppointment)

COMPLETED (terminal)
NO_SHOW (terminal)
CANCELLED (terminal)
```

### Business Rules

**NO_SHOW:**
- ✅ Only from CONFIRMED status
- ✅ Only after scheduled time has passed
- ✅ Terminal state (no further transitions)

**CANCELLED:**
- ✅ From REQUESTED or CONFIRMED (before CHECKED_IN)
- ✅ Requires cancellation reason
- ✅ Terminal state (no further transitions)

**Invalid Transitions:**
- All invalid transitions throw `InvalidTransitionError`

---

## 🔒 Authorization

### Access Control

| Role | Own Data | Other Provider Data | All Data |
|------|----------|---------------------|----------|
| PROVIDER | ✅ Full | ❌ Denied | ❌ Denied |
| FRONT_DESK | ✅ Full | ✅ Full | ✅ Full |

### How It Works

1. **Server Action** authenticates user
2. **Server Action** authorizes operation
3. **Service Layer** executes business logic
4. **Database** persists changes

```typescript
// Authorization happens in server actions
const session = await requireAuth();
const canAccess = await canAccessProviderData(providerId);
if (!canAccess) throw new UnauthorizedError();

// Service layer receives pre-authorized data
const result = await appointmentService.doSomething(...);
```

---

## ⚡ Key Features

### 1. Automatic Availability Checking

When creating/rescheduling appointments:
- Verifies provider has availability slot
- Checks appointment fits within slot boundaries
- Accounts for appointment duration
- Returns clear error if unavailable

### 2. Scheduling Conflict Detection

Prevents double-booking:
- Checks for overlapping appointments
- Accounts for duration
- Excludes current appointment when rescheduling
- Only checks active appointments

### 3. Overlap Detection for Availability

When creating/updating slots:
- Detects overlapping time slots
- Same provider and day
- Excludes current slot when updating
- Only checks active slots

### 4. Audit Trail

All state changes logged:
- AppointmentHistory table
- Action type tracking
- Previous and new values
- Who performed action
- Timestamp

### 5. Type Safety

End-to-end type safety:
- Zod schemas for runtime validation
- TypeScript types inferred from schemas
- Prisma types from database
- Custom error types

---

## 🧪 Testing

### Manual Testing

Use the seeded data:

```typescript
// Provider IDs (from seed data)
const drSmithId = 'get from database';
const drJohnsonId = 'get from database';

// Patient IDs (from seed data)
const johnDavisId = 'get from database';

// Create appointment
const result = await createAppointment({
  patientId: johnDavisId,
  providerId: drSmithId,
  scheduledAt: new Date('2026-09-15T10:00:00'),
  duration: 30,
  type: 'FOLLOW_UP',
  reason: 'Test appointment',
});
```

### Testing Invalid Transitions

```typescript
// Try to complete without check-in
const appt = await createAppointment({...});
await confirmAppointment({ appointmentId: appt.data.id });
await completeAppointment({ appointmentId: appt.data.id });
// Error: Invalid appointment status transition from CONFIRMED to COMPLETED
```

### Testing NO_SHOW Rules

```typescript
// Try to mark NO_SHOW before time
const appt = await createAppointment({
  scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
  ...
});
await confirmAppointment({ appointmentId: appt.data.id });
await markAppointmentNoShow({ appointmentId: appt.data.id });
// Error: Cannot mark appointment as NO_SHOW before the scheduled time
```

---

## 📖 Documentation

### Complete Guides

1. **Architecture Guide**: `docs/appointment-domain-architecture.md`
   - Layer details
   - Design patterns
   - Authorization model
   - State machine
   - Error handling
   - Testing strategy

2. **API Reference**: `docs/appointment-api-reference.md`
   - All server actions
   - Input/output types
   - Business rules
   - Error messages
   - Usage examples

3. **Implementation Summary**: `docs/IMPLEMENTATION_SUMMARY.md`
   - What was implemented
   - File structure
   - Architecture overview
   - Testing guide

---

## 🎨 Next Steps: UI Implementation

Now that the backend is complete, build the UI:

### 1. Appointment Management
- List view with filters (status, date range)
- Create appointment form
- Appointment detail page
- State transition buttons
- Cancel/reschedule modals

### 2. Availability Management
- Weekly schedule view
- Create/edit slot forms
- Archive/restore slots
- Conflict warnings

### 3. Dashboard
- Today's appointments
- Upcoming appointments
- Recent activity
- Statistics

### 4. Real-time Features
- Appointment notifications
- Status change alerts
- Auto-refresh

---

## 🚨 Common Errors

### "Provider is not available at the requested time"

**Cause**: Provider has no availability slot for that day/time

**Solution**: Create availability slot first, or choose different time

### "This time slot conflicts with an existing appointment"

**Cause**: Scheduling conflict with another appointment

**Solution**: Choose different time

### "Invalid appointment status transition from X to Y"

**Cause**: Invalid state machine transition

**Solution**: Follow valid transition path (see state machine diagram)

### "Cannot mark appointment as NO_SHOW before the scheduled time"

**Cause**: Trying to mark NO_SHOW before appointment time

**Solution**: Wait until after scheduled time

### "Cannot cancel appointment after patient has been checked in"

**Cause**: Trying to cancel after CHECKED_IN status

**Solution**: Complete the appointment instead

### "You can only create appointments for yourself"

**Cause**: PROVIDER trying to create appointment for different provider

**Solution**: PROVIDER can only create for themselves, or have FRONT_DESK create

---

## 💡 Tips

### 1. Use ActionResult Pattern

All server actions return standardized result:

```typescript
if (result.success) {
  // Use result.data
} else {
  // Display result.error to user
}
```

### 2. Revalidate Paths

Server actions automatically revalidate relevant paths:
- `/dashboard`
- `/appointments`
- `/appointments/[id]`

### 3. Error Handling

Custom errors provide clear messages:
- `InvalidTransitionError` - State machine violations
- `AppointmentNotFoundError` - Missing appointments
- `UnauthorizedAppointmentAccessError` - Authorization failures
- `OverlappingSlotError` - Time conflicts

### 4. Service Layer is Reusable

Can call service methods directly in:
- Server Components
- API Routes
- Background Jobs
- CLI Scripts

Just ensure user is authenticated/authorized first!

---

## 📦 Dependencies

- **Zod**: Input validation
- **Prisma**: Database ORM
- **Next.js 15**: Server Actions
- **TypeScript**: Type safety

All installed and configured!

---

## ✅ Checklist

- [x] Appointment service layer
- [x] Availability service layer
- [x] Server actions for appointments
- [x] Server actions for availability
- [x] Zod validation schemas
- [x] Custom error classes
- [x] State machine with all transitions
- [x] Business rules enforcement
- [x] Authorization at boundary
- [x] Automatic availability checking
- [x] Scheduling conflict detection
- [x] Overlap detection for slots
- [x] Audit trail creation
- [x] Type safety end-to-end
- [x] Comprehensive documentation

**Ready for UI implementation!** 🎉
