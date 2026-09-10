# Appointment Domain Architecture

## Overview

The appointment domain implements a **clean architecture** with clear separation of concerns:

```
Client/UI Components
        ↓
Server Actions (Authorization + Orchestration)
        ↓
Service Layer (Business Logic)
        ↓
Prisma ORM (Data Access)
        ↓
PostgreSQL Database
```

## Architecture Principles

### 1. **Separation of Concerns**

Each layer has a single responsibility:

- **Server Actions**: Handle authorization, input validation, and orchestration
- **Service Layer**: Implement business logic and domain rules
- **Validation Schemas**: Define data contracts with Zod
- **Error Classes**: Type-safe error handling

### 2. **Never Trust the Frontend**

All business logic lives in the service layer. Components call server actions, which:
1. Authenticate the user
2. Authorize the operation
3. Validate input with Zod
4. Delegate to service layer
5. Return result to client

### 3. **State Machine Pattern**

Appointments follow a strict state machine with validated transitions:

```
REQUESTED
  ↓ (confirm)
CONFIRMED
  ↓ (check-in)
CHECKED_IN
  ↓ (complete)
COMPLETED (terminal)

Additional paths:
- CONFIRMED → NO_SHOW (only after scheduled time)
- REQUESTED/CONFIRMED → CANCELLED (before check-in)
```

## Directory Structure

```
app/
  actions/
    appointment.actions.ts     # Server actions for appointments
    availability.actions.ts    # Server actions for availability

lib/
  services/
    appointment.service.ts     # Appointment business logic
    availability.service.ts    # Availability business logic
  validations/
    appointment.ts             # Zod schemas for appointments
    availability.ts            # Zod schemas for availability
  errors/
    appointment-errors.ts      # Custom error classes
  auth-helpers.ts              # Authorization utilities
```

## Layer Details

### **1. Server Actions** (`app/actions/*.actions.ts`)

**Purpose**: Authorization boundary and orchestration

**Responsibilities**:
- ✅ Authenticate user (`requireAuth()`)
- ✅ Authorize access (`canAccessProviderData()`)
- ✅ Validate input (Zod schemas)
- ✅ Call service layer
- ✅ Revalidate Next.js cache
- ✅ Return standardized result

**Pattern**:
```typescript
export async function someAction(input: InputType): Promise<ActionResult<T>> {
  try {
    // 1. Authenticate
    const session = await requireAuth();
    
    // 2. Validate
    const validatedInput = schema.parse(input);
    
    // 3. Authorize
    const canAccess = await canAccessProviderData(validatedInput.providerId);
    if (!canAccess) throw new UnauthorizedError();
    
    // 4. Delegate to service
    const result = await service.doSomething(validatedInput, session.user.id);
    
    // 5. Revalidate cache
    revalidatePath("/relevant-path");
    
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

**Why Server Actions?**
- Built into Next.js 15
- Type-safe from client to server
- Automatic serialization
- Progressive enhancement
- No separate API route needed

---

### **2. Service Layer** (`lib/services/*.service.ts`)

**Purpose**: Business logic and domain rules

**Responsibilities**:
- ✅ Enforce state transitions
- ✅ Validate business rules
- ✅ Coordinate database operations
- ✅ Create audit trail entries
- ✅ Check scheduling conflicts
- ✅ Verify availability

**Key Features**:

#### **Appointment Service**

- **State Machine Enforcement**:
  ```typescript
  private readonly VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
    REQUESTED: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["CHECKED_IN", "NO_SHOW", "CANCELLED"],
    CHECKED_IN: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    NO_SHOW: [],
    CANCELLED: [],
  };
  ```

- **Business Rules**:
  - ✅ NO_SHOW only from CONFIRMED and after scheduled time
  - ✅ CANCEL only before CHECKED_IN with reason
  - ✅ Automatic availability checking
  - ✅ Conflict detection
  - ✅ Audit trail creation

#### **Availability Service**

- **Slot Management**:
  - ✅ Create time slots with overlap detection
  - ✅ Update slots with validation
  - ✅ Soft delete (archive) slots
  - ✅ Restore archived slots
  - ✅ Query availability for scheduling

**Why Service Layer?**
- Reusable across different entry points
- Testable without HTTP/auth concerns
- Clear domain model
- Transaction management
- Business logic isolation

---

### **3. Validation Schemas** (`lib/validations/*.ts`)

**Purpose**: Type-safe input validation

**Responsibilities**:
- ✅ Define data contracts
- ✅ Validate types and formats
- ✅ Enforce constraints (min/max, required, etc.)
- ✅ Custom validation rules
- ✅ Generate TypeScript types

**Example**:
```typescript
export const createAppointmentSchema = z.object({
  patientId: z.string().cuid("Invalid patient ID"),
  providerId: z.string().cuid("Invalid provider ID"),
  scheduledAt: z.coerce.date(),
  duration: z.number().min(15).max(240).default(30),
  type: z.nativeEnum(AppointmentType).default(AppointmentType.FOLLOW_UP),
  reason: z.string().min(1).max(500),
  notes: z.string().max(1000).optional(),
}).refine(
  (data) => data.scheduledAt > new Date(),
  {
    message: "Appointment must be scheduled in the future",
    path: ["scheduledAt"],
  }
);
```

**Benefits**:
- Runtime validation
- Type inference
- Clear error messages
- Self-documenting API

---

### **4. Error Classes** (`lib/errors/*.ts`)

**Purpose**: Type-safe error handling

**Custom Errors**:
- `AppointmentError` - Base class
- `InvalidTransitionError` - State machine violations
- `AppointmentNotFoundError` - Missing appointments
- `UnauthorizedAppointmentAccessError` - Authorization failures
- `AvailabilityError` - Base class for availability
- `AvailabilitySlotNotFoundError` - Missing slots
- `UnauthorizedAvailabilityAccessError` - Authorization failures
- `OverlappingSlotError` - Time conflicts
- `ValidationError` - Input validation failures

**Benefits**:
- Specific error types
- Better error messages
- Type-safe error handling
- Easier debugging

---

## Appointment Lifecycle

### **State Machine Flow**

```
┌─────────────┐
│  REQUESTED  │ ← Initial state
└──────┬──────┘
       │ confirmAppointment()
       ↓
┌─────────────┐
│  CONFIRMED  │
└──────┬──────┘
       │ checkInAppointment()
       ↓
┌─────────────┐
│ CHECKED_IN  │
└──────┬──────┘
       │ completeAppointment()
       ↓
┌─────────────┐
│  COMPLETED  │ ← Terminal state
└─────────────┘

Alternative Paths:
- CONFIRMED → NO_SHOW (markNoShow, only after scheduled time)
- REQUESTED/CONFIRMED → CANCELLED (cancelAppointment, before check-in)
```

### **Transition Rules**

| From | To | Method | Rules |
|------|------|--------|-------|
| REQUESTED | CONFIRMED | `confirmAppointment()` | None |
| CONFIRMED | CHECKED_IN | `checkInAppointment()` | None |
| CHECKED_IN | COMPLETED | `completeAppointment()` | None |
| CONFIRMED | NO_SHOW | `markNoShow()` | Only after scheduled time |
| REQUESTED/CONFIRMED | CANCELLED | `cancelAppointment()` | Requires reason, before check-in |

### **Invalid Transitions**

All invalid transitions throw `InvalidTransitionError`:

```typescript
// ❌ Invalid: Cannot go from REQUESTED to COMPLETED
confirmAppointment() // REQUESTED → CONFIRMED
completeAppointment() // Error! Must check in first

// ❌ Invalid: Cannot cancel after check-in
checkInAppointment() // CONFIRMED → CHECKED_IN
cancelAppointment() // Error! Already checked in

// ❌ Invalid: Cannot mark NO_SHOW before scheduled time
markNoShow() // at 9:00 AM for 10:00 AM appointment
// Error! Cannot mark NO_SHOW before scheduled time

// ❌ Invalid: Cannot mark NO_SHOW from REQUESTED
markNoShow() // Error! Must be CONFIRMED first
```

---

## Availability Management

### **Slot Operations**

1. **Create Slot**:
   - Validates time range
   - Checks for overlaps
   - Creates active slot

2. **Update Slot**:
   - Loads existing slot
   - Validates new time range
   - Checks for overlaps (excluding self)
   - Updates slot

3. **Archive Slot**:
   - Soft delete (sets `isActive = false`)
   - Preserves data for history

4. **Restore Slot**:
   - Re-activates archived slot
   - Checks for overlaps with active slots

### **Availability Checking**

When creating/rescheduling appointments:

1. ✅ Check provider has availability slot for day/time
2. ✅ Verify appointment fits within slot boundaries
3. ✅ Check for scheduling conflicts with other appointments
4. ✅ Account for appointment duration

---

## Authorization Model

### **Access Control**

| Role | Own Data | Other Provider Data | All Data |
|------|----------|---------------------|----------|
| PROVIDER | ✅ Full | ❌ Denied | ❌ Denied |
| FRONT_DESK | ✅ Full | ✅ Full | ✅ Full |

### **Authorization Flow**

```typescript
// 1. Server action authenticates
const session = await requireAuth();

// 2. Server action authorizes
const canAccess = await canAccessProviderData(providerId);
if (!canAccess) throw new UnauthorizedError();

// 3. Service layer receives pre-authorized data
// No authorization logic in service layer!
```

**Why this pattern?**
- Authorization at the boundary
- Service layer is "pure" business logic
- Easier to test services
- Clear security model

---

## Usage Examples

### **Client Component**

```typescript
'use client';

import { createAppointment } from '@/app/actions/appointment.actions';

export function BookAppointmentForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createAppointment({
      patientId: formData.get('patientId') as string,
      providerId: formData.get('providerId') as string,
      scheduledAt: new Date(formData.get('scheduledAt') as string),
      duration: 30,
      type: 'FOLLOW_UP',
      reason: formData.get('reason') as string,
    });

    if (result.success) {
      // Show success message
    } else {
      // Show error: result.error
    }
  }

  return <form action={handleSubmit}>...</form>;
}
```

### **Server Component**

```typescript
import { appointmentService } from '@/lib/services/appointment.service';
import { requireAuth, canAccessProviderData } from '@/lib/auth-helpers';

export default async function AppointmentPage({ params }: { params: { id: string } }) {
  // Authenticate
  const session = await requireAuth();
  
  // Get appointment
  const appointment = await appointmentService.getAppointmentById(params.id);
  
  // Authorize
  const canAccess = await canAccessProviderData(appointment.providerId);
  if (!canAccess) redirect('/unauthorized');
  
  return <div>...</div>;
}
```

---

## Error Handling

### **Pattern**

All server actions return a standardized result:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### **Client Handling**

```typescript
const result = await someAction(input);

if (result.success) {
  // Use result.data
} else {
  // Display result.error
}
```

### **Error Types**

- **Validation errors**: Zod schema violations
- **Business rule errors**: State machine violations
- **Authorization errors**: Access denied
- **Not found errors**: Resource doesn't exist
- **Conflict errors**: Scheduling conflicts, overlaps

---

## Testing Strategy

### **Service Layer Tests**

Test business logic without HTTP/auth:

```typescript
describe('AppointmentService', () => {
  it('should enforce state transitions', async () => {
    const appointment = await appointmentService.createAppointment(...);
    
    // Valid transition
    await appointmentService.confirmAppointment(appointment.id, userId);
    
    // Invalid transition
    await expect(
      appointmentService.completeAppointment(appointment.id, userId)
    ).rejects.toThrow(InvalidTransitionError);
  });
});
```

### **Server Action Tests**

Test authorization and orchestration:

```typescript
describe('confirmAppointment', () => {
  it('should reject unauthorized access', async () => {
    // Mock session as different provider
    const result = await confirmAppointment({ appointmentId: 'xyz' });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unauthorized');
  });
});
```

---

## Benefits of This Architecture

### **1. Maintainability**
- Clear separation of concerns
- Easy to find and fix bugs
- Self-documenting code

### **2. Testability**
- Service layer is pure functions
- Mock-free testing
- Fast unit tests

### **3. Security**
- Authorization at the boundary
- Business logic isolated from auth
- Type-safe error handling

### **4. Scalability**
- Service layer reusable across contexts
- Easy to add new features
- Clear extension points

### **5. Type Safety**
- End-to-end TypeScript
- Zod runtime validation
- Prisma type generation

---

## Future Enhancements

### **1. Event Sourcing**
- Store all state transitions as events
- Rebuild state from event log
- Full audit trail

### **2. Domain Events**
- Emit events on state changes
- Decouple side effects
- Enable notifications, webhooks

### **3. CQRS Pattern**
- Separate read/write models
- Optimize queries separately
- Better performance

### **4. Saga Pattern**
- Handle complex workflows
- Distributed transactions
- Compensation logic

---

## Key Takeaways

✅ **Business logic lives in services, not components**
✅ **Authorization happens in server actions**
✅ **State machine enforces appointment lifecycle**
✅ **Zod validates all inputs**
✅ **Custom errors provide clear feedback**
✅ **Availability checked before booking**
✅ **Audit trail for all changes**
✅ **Type-safe from client to database**
