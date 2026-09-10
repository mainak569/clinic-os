# Appointment Domain API Reference

## Server Actions

All server actions return `ActionResult<T>`:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

---

## Appointment Actions

### `createAppointment(input)`

Create a new appointment in REQUESTED status.

**Input**:
```typescript
{
  patientId: string;        // cuid
  providerId: string;       // cuid
  scheduledAt: Date;        // Must be in future
  duration: number;         // 15-240 minutes, default 30
  type: AppointmentType;    // NEW_PATIENT | FOLLOW_UP | CONSULTATION | PROCEDURE | EMERGENCY
  reason: string;           // 1-500 characters
  notes?: string;           // Max 1000 characters
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Scheduled time must be in future
- ✅ Provider must have availability slot
- ✅ Must not conflict with existing appointments
- ✅ User must be authorized for provider

**Throws**:
- "Provider is not available at the requested time"
- "This time slot conflicts with an existing appointment"
- "You can only create appointments for yourself" (PROVIDER role)

---

### `confirmAppointment(input)`

Transition: REQUESTED → CONFIRMED

**Input**:
```typescript
{
  appointmentId: string;
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Must be in REQUESTED status
- ✅ User must be authorized for provider

**Throws**:
- `InvalidTransitionError` if not in REQUESTED status

---

### `checkInAppointment(input)`

Transition: CONFIRMED → CHECKED_IN

**Input**:
```typescript
{
  appointmentId: string;
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Must be in CONFIRMED status
- ✅ Sets `checkedInAt` timestamp
- ✅ User must be authorized for provider

**Throws**:
- `InvalidTransitionError` if not in CONFIRMED status

---

### `completeAppointment(input)`

Transition: CHECKED_IN → COMPLETED

**Input**:
```typescript
{
  appointmentId: string;
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Must be in CHECKED_IN status
- ✅ Sets `checkedOutAt` timestamp
- ✅ Terminal state (no further transitions)
- ✅ User must be authorized for provider

**Throws**:
- `InvalidTransitionError` if not in CHECKED_IN status

---

### `markAppointmentNoShow(input)`

Transition: CONFIRMED → NO_SHOW

**Input**:
```typescript
{
  appointmentId: string;
  notes?: string;           // Max 500 characters
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Must be in CONFIRMED status
- ✅ Can only mark after scheduled time has passed
- ✅ Terminal state (no further transitions)
- ✅ User must be authorized for provider

**Throws**:
- `InvalidTransitionError` if not in CONFIRMED status
- "Cannot mark appointment as NO_SHOW before the scheduled time"

---

### `cancelAppointment(input)`

Transition: REQUESTED/CONFIRMED → CANCELLED

**Input**:
```typescript
{
  appointmentId: string;
  cancellationReason: string;  // Required, 1-500 characters
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Can cancel from REQUESTED or CONFIRMED
- ✅ Cannot cancel after CHECKED_IN
- ✅ Requires cancellation reason
- ✅ Terminal state (no further transitions)
- ✅ User must be authorized for provider

**Throws**:
- `InvalidTransitionError` if in terminal state
- "Cannot cancel appointment after patient has been checked in"

---

### `rescheduleAppointment(input)`

Reschedule an existing appointment.

**Input**:
```typescript
{
  appointmentId: string;
  newScheduledAt: Date;     // Must be in future
  reason?: string;          // Max 500 characters
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Cannot reschedule terminal states (COMPLETED, NO_SHOW, CANCELLED)
- ✅ New time must be in future
- ✅ Provider must have availability at new time
- ✅ Must not conflict with existing appointments
- ✅ Creates history entry
- ✅ User must be authorized for provider

**Throws**:
- "Cannot reschedule appointment with status X"
- "Provider is not available at the requested time"
- "This time slot conflicts with an existing appointment"

---

### `getMyAppointments(filters?)`

Get appointments for current user's provider.

**Input** (optional):
```typescript
{
  status?: AppointmentStatus;
  startDate?: Date;
  endDate?: Date;
}
```

**Returns**: `ActionResult<Appointment[]>`

**Business Rules**:
- ✅ PROVIDER: Returns only their appointments
- ✅ FRONT_DESK: Not yet implemented
- ✅ Ordered by scheduled time ascending

---

## Availability Actions

### `createAvailabilitySlot(input)`

Create a new availability slot for a provider.

**Input**:
```typescript
{
  providerId: string;
  dayOfWeek: DayOfWeek;     // MONDAY | TUESDAY | ... | SUNDAY
  startTime: Date;          // Time component used
  endTime: Date;            // Time component used
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ End time must be after start time
- ✅ Must not overlap with existing active slots
- ✅ User must be authorized for provider

**Throws**:
- "This time slot overlaps with an existing availability slot"
- "You are not authorized to modify this availability slot"

---

### `updateAvailabilitySlot(input)`

Update an existing availability slot.

**Input**:
```typescript
{
  slotId: string;
  dayOfWeek?: DayOfWeek;
  startTime?: Date;
  endTime?: Date;
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ End time must be after start time (if both provided)
- ✅ Must not overlap with other active slots
- ✅ User must be authorized for provider

**Throws**:
- "Availability slot not found"
- "This time slot overlaps with an existing availability slot"

---

### `archiveAvailabilitySlot(input)`

Archive (soft delete) an availability slot.

**Input**:
```typescript
{
  slotId: string;
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Sets `isActive = false`
- ✅ Preserves data for history
- ✅ User must be authorized for provider

---

### `restoreAvailabilitySlot(input)`

Restore an archived availability slot.

**Input**:
```typescript
{
  slotId: string;
}
```

**Returns**: `ActionResult<{ id: string }>`

**Business Rules**:
- ✅ Sets `isActive = true`
- ✅ Must not overlap with active slots
- ✅ User must be authorized for provider

**Throws**:
- "This time slot overlaps with an existing availability slot"

---

### `getProviderAvailability(providerId, includeInactive?)`

Get all availability slots for a provider.

**Input**:
```typescript
providerId: string;
includeInactive?: boolean;  // Default false
```

**Returns**: `ActionResult<AvailabilitySlot[]>`

**Business Rules**:
- ✅ User must be authorized to view provider
- ✅ Ordered by day of week and start time

---

## Service Layer

### AppointmentService

#### `createAppointment(input, performedBy)`

#### `confirmAppointment(appointmentId, performedBy)`

#### `checkInAppointment(appointmentId, performedBy)`

#### `completeAppointment(appointmentId, performedBy)`

#### `markNoShow(appointmentId, notes, performedBy)`

#### `cancelAppointment(appointmentId, cancellationReason, performedBy)`

#### `rescheduleAppointment(appointmentId, newScheduledAt, reason, performedBy)`

#### `getAppointmentById(appointmentId)`

Returns full appointment with patient, provider, and visit note.

#### `getProviderAppointments(providerId, filters?)`

Returns appointments for a specific provider.

#### `getPatientAppointments(patientId, filters?)`

Returns appointments for a specific patient.

---

### AvailabilityService

#### `createSlot(input)`

#### `updateSlot(slotId, input)`

#### `archiveSlot(slotId)`

#### `restoreSlot(slotId)`

#### `getProviderSlots(providerId, includeInactive?)`

#### `getSlotById(slotId)`

#### `isProviderAvailable(providerId, scheduledAt, duration)`

Check if provider has availability for a specific time/duration.

---

## State Machine

### Valid Transitions

```typescript
const VALID_TRANSITIONS = {
  REQUESTED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
  CHECKED_IN: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  NO_SHOW: [],
  CANCELLED: [],
};
```

### Transition Methods

| From | To | Method |
|------|------|--------|
| REQUESTED | CONFIRMED | `confirmAppointment()` |
| CONFIRMED | CHECKED_IN | `checkInAppointment()` |
| CHECKED_IN | COMPLETED | `completeAppointment()` |
| CONFIRMED | NO_SHOW | `markNoShow()` |
| REQUESTED/CONFIRMED | CANCELLED | `cancelAppointment()` |

---

## Error Reference

### Custom Errors

- `AppointmentError` - Base appointment error
- `InvalidTransitionError` - Invalid state transition
- `AppointmentNotFoundError` - Appointment doesn't exist
- `UnauthorizedAppointmentAccessError` - Authorization failed
- `AvailabilityError` - Base availability error
- `AvailabilitySlotNotFoundError` - Slot doesn't exist
- `UnauthorizedAvailabilityAccessError` - Authorization failed
- `OverlappingSlotError` - Time conflict
- `ValidationError` - Input validation failed

### Common Error Messages

**Appointment Errors**:
- "Invalid appointment status transition from X to Y"
- "Appointment not found: {id}"
- "You are not authorized to access this appointment"
- "Provider is not available at the requested time"
- "This time slot conflicts with an existing appointment"
- "Cannot mark appointment as NO_SHOW before the scheduled time"
- "Cannot cancel appointment after patient has been checked in"

**Availability Errors**:
- "Availability slot not found: {id}"
- "You are not authorized to modify this availability slot"
- "This time slot overlaps with an existing availability slot"
- "End time must be after start time"

**Validation Errors**:
- "Invalid patient ID"
- "Invalid provider ID"
- "Invalid appointment ID"
- "Appointment must be scheduled in the future"
- "Duration must be at least 15 minutes"
- "Reason is required"
- "Cancellation reason is required"

---

## Usage Examples

### Create and Progress Appointment

```typescript
// Create appointment
const createResult = await createAppointment({
  patientId: 'patient_123',
  providerId: 'provider_456',
  scheduledAt: new Date('2026-09-15T10:00:00'),
  duration: 30,
  type: 'FOLLOW_UP',
  reason: 'Regular checkup',
});

if (!createResult.success) {
  console.error(createResult.error);
  return;
}

const appointmentId = createResult.data.id;

// Confirm appointment
await confirmAppointment({ appointmentId });

// Check in patient
await checkInAppointment({ appointmentId });

// Complete appointment
await completeAppointment({ appointmentId });
```

### Handle No-Show

```typescript
// Only after scheduled time
const result = await markAppointmentNoShow({
  appointmentId: 'appt_123',
  notes: 'Patient did not arrive for appointment',
});
```

### Cancel Appointment

```typescript
const result = await cancelAppointment({
  appointmentId: 'appt_123',
  cancellationReason: 'Patient requested to reschedule due to work conflict',
});
```

### Manage Availability

```typescript
// Create Monday morning slot
const createResult = await createAvailabilitySlot({
  providerId: 'provider_456',
  dayOfWeek: 'MONDAY',
  startTime: new Date('2024-01-01T09:00:00'),
  endTime: new Date('2024-01-01T12:00:00'),
});

// Update slot
await updateAvailabilitySlot({
  slotId: createResult.data.id,
  endTime: new Date('2024-01-01T13:00:00'),
});

// Archive slot
await archiveAvailabilitySlot({
  slotId: createResult.data.id,
});
```
