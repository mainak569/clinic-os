# Database Schema

## Overview

ClinicOS uses PostgreSQL (via Supabase) with Prisma ORM. The schema includes 11 models designed for healthcare practice management with audit trail support.

The models, numbered as in [Core Models](#core-models) below:

1. **User** - Authentication and user accounts
2. **Provider** - Healthcare provider profiles
3. **ProviderProfile** - Specialization, licence and scheduling defaults for a provider
4. **Patient** - Patient records and demographics
5. **AvailabilitySlot** - Weekly provider availability
6. **Appointment** - Appointment scheduling and tracking
7. **VisitNote** - Clinical documentation for an appointment
8. **VisitNoteHistory** - Immutable history of visit note changes
9. **AppointmentHistory** - Immutable log of appointment changes
10. **Alert** - System notifications
11. **AuditLog** - Audit trail for compliance

## Technology

- **Database**: PostgreSQL 14+
- **ORM**: Prisma 5.22
- **Hosting**: Supabase (with connection pooling)
- **Migration Strategy**: Prisma Migrate with versioned migrations

## Database Configuration

### Connection URLs

```env
# Transaction Pooler (for application queries)
DATABASE_URL="postgresql://...@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection (for migrations)
DIRECT_URL="postgresql://...@xxx.pooler.supabase.com:5432/postgres"
```

The dual URL configuration prevents "prepared statement" errors with PgBouncer.

## Core Models

### 1. User

Authentication and user accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| email | String | Unique, Indexed | Login email |
| passwordHash | String | Required | bcrypt hash |
| role | Role | Default: FRONT_DESK | PROVIDER or FRONT_DESK |
| isActive | Boolean | Default: true | Account status |
| lastLogin | DateTime | Nullable | Last login timestamp |
| createdAt | DateTime | Auto | Account creation |
| updatedAt | DateTime | Auto | Last update |
| deletedAt | DateTime | Nullable | Soft delete |

**Relationships**:
- 1:1 → Provider
- 1:many → VisitNote (as author)
- 1:many → VisitNote (as editor)
- 1:many → AuditLog

**Indexes**:
- `email` (unique)
- `role`

### 2. Provider

Healthcare provider profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| userId | String | FK, Unique | Link to User account |
| firstName | String | Required | Provider first name |
| lastName | String | Required | Provider last name |
| title | String | Nullable | Dr., NP, PA, etc. |
| isActive | Boolean | Default: true | Provider status |
| createdAt | DateTime | Auto | Record creation |
| updatedAt | DateTime | Auto | Last update |
| deletedAt | DateTime | Nullable | Soft delete |

**Relationships**:
- 1:1 → User
- 1:1 → ProviderProfile
- 1:many → AvailabilitySlot
- 1:many → Appointment
- 1:many → Alert

**Indexes**:
- `userId`
- `firstName, lastName` (composite)

**Cascade**: Deleting User deletes Provider

**Active status**: Providers are created and managed from the Providers page
(front desk). Deactivating a provider sets `isActive = false` and `deletedAt` on
both the Provider and its User, which blocks sign-in and new bookings. It is
refused while the provider has REQUESTED, CONFIRMED or CHECKED_IN appointments.
User, Provider and ProviderProfile are always written in one transaction.

### 3. ProviderProfile

Extended provider information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| providerId | String | FK, Unique | Link to Provider |
| specialization | String | Nullable | Medical specialty |
| licenseNumber | String | Nullable | Medical license |
| phone | String | Nullable | Contact phone |
| officeLocation | String | Nullable | Office/room number |
| bio | String | Nullable | Provider biography |
| appointmentLength | Int | Default: 30 | Default appointment minutes |
| bufferTime | Int | Default: 15 | Minutes between appointments |
| createdAt | DateTime | Auto | Record creation |
| updatedAt | DateTime | Auto | Last update |

**Relationships**:
- 1:1 → Provider

**Cascade**: Deleting Provider deletes Profile

### 4. Patient

Patient records and demographics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| firstName | String | Required | Patient first name |
| lastName | String | Required | Patient last name |
| email | String | Unique, Nullable | Contact email |
| phone | String | Unique, Nullable | Contact phone |
| dateOfBirth | DateTime | Nullable | Date of birth |
| address | String | Nullable | Street address |
| city | String | Nullable | City |
| state | String | Nullable | State/province |
| zipCode | String | Nullable | Postal code |
| emergencyContactName | String | Nullable | Emergency contact |
| emergencyContactPhone | String | Nullable | Emergency phone |
| insuranceProvider | String | Nullable | Insurance company |
| insuranceId | String | Nullable | Insurance ID |
| allergies | String | Nullable | Known allergies |
| medications | String | Nullable | Current medications |
| medicalHistory | String | Nullable | Medical history |
| isActive | Boolean | Default: true | Patient status |
| createdAt | DateTime | Auto | Record creation |
| updatedAt | DateTime | Auto | Last update |
| deletedAt | DateTime | Nullable | Soft delete |

**Relationships**:
- 1:many → Appointment

**Indexes**:
- `email` (unique)
- `phone` (unique)
- `firstName, lastName` (composite)
- `dateOfBirth`

**Uniqueness and soft delete**:
- Email is stored trimmed and lower-cased, so uniqueness is effectively case-insensitive.
- Deleting a patient is a soft delete (`isActive = false`, `deletedAt` set) and
  keeps email and phone. Because those columns are unique, registering the same
  person again restores the archived record with the new details rather than
  creating a second row.
- A patient can't be deleted while they have any open appointment
  (REQUESTED, CONFIRMED or CHECKED_IN), and archived patients can't be booked.

### 5. AvailabilitySlot

Provider availability: recurring weekly opening hours such as "Mondays 09:00–12:00".

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| providerId | String | FK, Indexed | Link to Provider |
| dayOfWeek | DayOfWeek | Enum | MONDAY-SUNDAY, on the clinic's calendar |
| startTime | DateTime | Required | Wall-clock start time, stored on `1970-01-01` (see below) |
| endTime | DateTime | Required | Wall-clock end time, stored on `1970-01-01` (see below) |
| isActive | Boolean | Default: true | Slot active status (archived slots are `false`) |
| createdAt | DateTime | Auto | Record creation |
| updatedAt | DateTime | Auto | Last update |

**Relationships**:
- many:1 → Provider

**Indexes**:
- `providerId`
- `dayOfWeek`
- Unique constraint: `[providerId, dayOfWeek, startTime, endTime]`

**Cascade**: Deleting Provider deletes AvailabilitySlots

#### Time encoding: wall-clock time on a fixed date

A slot is a recurring time of day, not a moment in time, but Postgres stores
`startTime` and `endTime` as timestamps. They therefore use one fixed date,
`1970-01-01`, and the wall-clock time goes in the **UTC** fields:

| Clinic time | Stored value |
|-------------|--------------|
| 09:00 | `1970-01-01T09:00:00.000Z` |
| 13:30 | `1970-01-01T13:30:00.000Z` |
| 17:45 | `1970-01-01T17:45:00.000Z` |

The value means "09:00 on the clinic's clock", **not** 09:00 UTC. All
conversions live in `lib/clinic-time.ts`:

- `timeStringToSlotDate("09:30")` builds the stored value from an `"HH:MM"` string.
- `slotMinutes(value)` reads it back as minutes after midnight, using the UTC fields.
- `slotDateToTimeString(value)` (form inputs) and `formatSlotTime(value)`
  (display, e.g. "9:30 AM") format it without applying any timezone.

Slot times travel between the browser and the server as 24-hour, zero-padded
`"HH:MM"` strings (validated by `isTimeString`). The browser never builds a
`Date` for a slot, so its timezone can't reach the database.

#### Why the fixed date exists

Slots used to be stored as whatever `new Date()` produced in the browser, then
read with the server's local `getHours()`. That broke three ways, all visible in
live data:

1. **Two encodings in one table.** Seeded rows kept the wall time in the UTC
   fields on `2024-01-01`, while UI-created rows stored a browser-local instant
   (9:00 AM in Asia/Kolkata became `2026-09-12T03:30:00Z`). The same "09:00"
   was two different values.
2. **Availability depended on the server's timezone.** It was correct on a
   laptop in IST and shifted by 5h30 on a UTC host such as Vercel. The schedule
   showed an 8 AM–12 PM slot as 1:30–5:30 PM.
3. **Meaningless date parts.** Slots carried whatever date they were created
   on, so the overlap check and the unique constraint compared dates that had
   nothing to do with the schedule.

With every slot on `1970-01-01`, comparing two `startTime` values in the
database compares times of day. The overlap check and the unique constraint are
correct again, with no schema change.

#### How `CLINIC_TIMEZONE` is used at comparison time

Appointments stay real instants (`Appointment.scheduledAt`). Before an
appointment is compared with slots, it is converted to the clinic's wall clock.

The zone is resolved once, in this order:

1. `NEXT_PUBLIC_CLINIC_TIMEZONE`
2. `CLINIC_TIMEZONE`
3. `"Asia/Kolkata"` (default)

`clinicWallClock(instant)` uses `Intl.DateTimeFormat` with that zone to return
the appointment's **weekday** and **minutes after midnight** in clinic time.
`AvailabilityService.isProviderAvailable()` then:

1. Takes the clinic weekday and start minute from `clinicWallClock(scheduledAt)`,
   and computes the end minute as start + `duration`.
2. Returns unavailable if the visit would run past midnight (end > 1440).
3. Loads that provider's **active** slots for that weekday.
4. Returns available if any slot satisfies
   `start >= slotMinutes(slot.startTime)` and `end <= slotMinutes(slot.endTime)`.

The weekday also comes from the clinic's clock, so an appointment at 01:30 on
Monday in Kolkata (Sunday 20:00 UTC) is checked against Monday's slots. The
server's own timezone plays no part in any of this. One deployment supports one
clinic timezone; set `CLINIC_TIMEZONE` explicitly on any host that doesn't run
in the clinic's zone.

#### Migrating existing data: `scripts/migrate-slot-times.ts`

A one-off, idempotent data migration that rewrites legacy slots into the
canonical encoding. It changes data only; the schema is unchanged.

```bash
npx tsx scripts/migrate-slot-times.ts           # dry run (default): prints the plan
npx tsx scripts/migrate-slot-times.ts --apply   # writes all changes in one transaction
```

For each slot it recovers the intended wall-clock time from how the row was stored:

| Stored date part | Treated as | Wall time taken from |
|------------------|------------|----------------------|
| `1970-01-01` | Already canonical | UTC fields (row is skipped) |
| `2024-01-01` | Seed encoding | UTC fields; only the date changes |
| Anything else | Browser-local instant from the UI | The instant read in `CLINIC_TIMEZONE` |

The dry run prints the clinic timezone, then each slot's current value and its
new `HH:MM–HH:MM`. Before writing anything, the script refuses to continue if:

- any slot would end at or before its start, or
- two slots would become identical and violate
  `[providerId, dayOfWeek, startTime, endTime]`.

With `--apply`, every pending update runs in a single transaction, so a failure
leaves the table untouched. Re-running is safe: rows already on `1970-01-01` are
left alone.

> **Run it with `CLINIC_TIMEZONE` set to the zone the slots were created in.**
> UI-created rows are interpreted as instants in that zone. A wrong zone would
> shift those slots by the difference, and the dry run's clinic-timezone line is
> there so you can check it first. Back up the table before `--apply`.

### 6. Appointment

Appointment scheduling and tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| patientId | String | FK, Indexed | Link to Patient |
| providerId | String | FK, Indexed | Link to Provider |
| scheduledAt | DateTime | Indexed | Appointment date/time |
| duration | Int | Default: 30 | Duration in minutes |
| type | AppointmentType | Default: FOLLOW_UP | Appointment type |
| status | AppointmentStatus | Default: REQUESTED | Current status |
| reason | String | Nullable | Reason for visit |
| notes | String | Nullable | Additional notes |
| checkedInAt | DateTime | Nullable | Check-in timestamp |
| checkedOutAt | DateTime | Nullable | Check-out timestamp |
| cost | Decimal(10,2) | Nullable | Appointment cost |
| paid | Boolean | Default: false | Payment status |
| createdAt | DateTime | Auto, Indexed | Record creation |
| updatedAt | DateTime | Auto | Last update |
| deletedAt | DateTime | Nullable | Soft delete |

**Relationships**:
- many:1 → Patient
- many:1 → Provider
- 1:1 → VisitNote
- 1:many → AppointmentHistory

**Indexes**:
- `patientId`
- `providerId`
- `scheduledAt`
- `status`
- `createdAt`

**Enums**:
- **AppointmentStatus**: REQUESTED, CONFIRMED, CHECKED_IN, COMPLETED, NO_SHOW, CANCELLED
- **AppointmentType**: NEW_PATIENT, FOLLOW_UP, CONSULTATION, PROCEDURE, EMERGENCY

**Note**: `cost` is a Decimal and is converted to a number before being sent to the client. `deletedAt` exists but appointments are never soft-deleted; cancellation is a status.

### 7. VisitNote

Clinical documentation for appointments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| appointmentId | String | FK, Unique | Link to Appointment |
| authorId | String | FK, Indexed | Provider who created |
| chiefComplaint | String | Nullable | Chief complaint |
| historyOfPresent | String | Nullable | History of present illness |
| physicalExam | String | Nullable | Physical examination |
| assessment | String | Nullable | Assessment |
| plan | String | Nullable | Treatment plan |
| bloodPressure | String | Nullable | Blood pressure reading |
| heartRate | Int | Nullable | Heart rate (bpm) |
| temperature | Decimal(4,1) | Nullable | Temperature (°F) |
| respiratoryRate | Int | Nullable | Respiratory rate |
| oxygenSaturation | Int | Nullable | O2 saturation (%) |
| weight | Decimal(5,2) | Nullable | Weight (lbs) |
| height | Decimal(5,2) | Nullable | Height (inches) |
| prescriptions | String | Nullable | Prescriptions written |
| labOrders | String | Nullable | Lab orders |
| imagingOrders | String | Nullable | Imaging orders |
| referrals | String | Nullable | Referrals made |
| followUpInstructions | String | Nullable | Follow-up instructions |
| nextVisitDate | DateTime | Nullable | Next visit date |
| createdAt | DateTime | Auto, Indexed | Record creation |
| updatedAt | DateTime | Auto | Last update |
| lastEditedBy | String | Nullable | User ID of last editor |
| lastEditedAt | DateTime | Nullable | Last edit timestamp |

**Relationships**:
- many:1 → Appointment
- many:1 → User (author)
- many:1 → User (lastEditor)
- 1:many → VisitNoteHistory

**Indexes**:
- `appointmentId` (unique)
- `authorId`
- `createdAt`

**Cascade**: Deleting Appointment deletes VisitNote

**Vital sign ranges** (enforced by validation, sized to fit the columns):
heart rate 20–300, temperature 80–115 °F, respiratory rate 4–80, oxygen
saturation 0–100, weight and height 0.1–999.99. Blood pressure must look like
`120/80`. On edit, sending `null` clears a field.

### 8. VisitNoteHistory

Immutable history of visit note changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| visitNoteId | String | FK, Indexed | Link to VisitNote |
| *[all visit note fields]* | Various | Nullable | Snapshot of note |
| editedBy | String | FK | User who made change |
| editedAt | DateTime | Auto, Indexed | Change timestamp |
| changeReason | String | Nullable | Reason for edit |

**Relationships**:
- many:1 → VisitNote
- many:1 → User (editor)

**Indexes**:
- `visitNoteId`
- `editedAt`

**Immutability**: Records are never updated or deleted after creation.

**Cascade**: Deleting VisitNote deletes History

### 9. AppointmentHistory

Audit trail for appointment changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| appointmentId | String | FK, Indexed | Link to Appointment |
| action | HistoryAction | Enum | Type of action |
| field | String | Nullable | Field that changed |
| previousValue | String | Nullable | Old value |
| newValue | String | Nullable | New value |
| notes | String | Nullable | Additional notes |
| metadata | String | Nullable | JSON metadata |
| performedBy | String | FK, Indexed | User who made change |
| performedAt | DateTime | Auto, Indexed | Action timestamp |

**Relationships**:
- many:1 → Appointment
- many:1 → User (performer)

**Indexes**:
- `appointmentId`
- `action`
- `performedAt`
- `performedBy`

**Enums**:
- **HistoryAction**: CREATED, UPDATED, CANCELLED, CONFIRMED, CHECKED_IN, COMPLETED, NO_SHOW, RESCHEDULED, etc.

**Immutability**: Records are never updated or deleted after creation.

**Cascade**: Deleting Appointment deletes History

### 10. Alert

System notifications and alerts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| providerId | String | FK, Indexed, Nullable | Link to Provider |
| type | AlertType | Enum | Alert type |
| priority | AlertPriority | Default: MEDIUM | Alert priority |
| title | String | Required | Alert title |
| message | String | Required | Alert message |
| isRead | Boolean | Default: false, Indexed | Read status |
| isDismissed | Boolean | Default: false | Dismissed status |
| expiresAt | DateTime | Nullable | Expiration date |
| createdAt | DateTime | Auto, Indexed | Creation timestamp |
| updatedAt | DateTime | Auto | Last update |

**Relationships**:
- many:1 → Provider

**Indexes**:
- `providerId`
- `type`
- `priority`
- `isRead`
- `createdAt`

**Enums**:
- **AlertType**: APPOINTMENT_REMINDER, FOLLOW_UP_DUE, LAB_RESULTS, PRESCRIPTION_RENEWAL, SYSTEM_MESSAGE, EMERGENCY
- **AlertPriority**: LOW, MEDIUM, HIGH, CRITICAL

**Known gap**: Alert has no `appointmentId` column. The generator embeds
`[ID: <appointmentId>]` in the message and the reader parses it back. It works,
but it isn't enforced by a foreign key. Alert de-duplication matches on that embedded id.

### 11. AuditLog

HIPAA-oriented audit trail (demonstration; not compliance-certified).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| userId | String | FK, Indexed | User who performed action |
| action | AuditAction | Enum, Indexed | Action performed |
| resource | ResourceType | Enum | Resource type |
| resourceId | String | Indexed | Resource ID |
| details | String | Nullable | JSON details |
| ipAddress | String | Nullable | Client IP address |
| userAgent | String | Nullable | Client user agent |
| timestamp | DateTime | Auto, Indexed | Action timestamp |

**Relationships**:
- many:1 → User

**Indexes**:
- `userId`
- `resource, resourceId` (composite)
- `timestamp`
- `action`

**Enums**:
- **AuditAction**: CREATE, READ, UPDATE, DELETE, EXPORT, PRINT, LOGIN, LOGOUT, ACCESS_DENIED
- **ResourceType**: APPOINTMENT, PATIENT, VISIT_NOTE, PROVIDER, USER, AVAILABILITY, ALERT

**Immutability**: Records are never updated or deleted after creation.

## Relationships Summary

### One-to-One
- User ↔ Provider
- Provider ↔ ProviderProfile
- Appointment ↔ VisitNote

### One-to-Many
- Provider → AvailabilitySlot
- Provider → Appointment
- Provider → Alert
- Patient → Appointment
- User → VisitNote (as author)
- User → AuditLog
- Appointment → AppointmentHistory
- VisitNote → VisitNoteHistory

## Constraints

### Database-Level Constraints
1. **Foreign Keys**: All relationships enforce referential integrity
2. **Unique Constraints**:
   - User.email
   - Patient.email
   - Patient.phone
   - Provider.userId
   - AvailabilitySlot: `[providerId, dayOfWeek, startTime, endTime]`
   - VisitNote.appointmentId
3. **Default Values**: Most timestamps, boolean flags, and enums have defaults
4. **Cascade Deletes**:
   - User → Provider → ProviderProfile, AvailabilitySlot, Appointment
   - Appointment → VisitNote → VisitNoteHistory
   - Appointment → AppointmentHistory

### Application-Level Constraints
1. **State Machine**: Appointment status transitions enforced in code
2. **Provider Isolation**: Providers can only access their own data
3. **Time Validation**: Appointments must fall inside a slot on the clinic's wall clock, and can't start in the past
4. **Conflict Detection**: Two visits conflict when each starts before the other ends. The check and the insert run under a per-provider advisory lock (`pg_advisory_xact_lock`) so concurrent bookings can't both succeed
5. **Bookability**: Archived patients and inactive providers can't be booked
6. **Audit Logging**: Patient, appointment, visit-note and provider changes create audit log entries

## Denormalization

### Deliberately Denormalized

1. **Patient Demographics**: Stored directly on Patient (not normalized to separate Address table)
   - **Why**: Simple, reduces joins, sufficient for MVP
   - **Trade-off**: Harder to validate addresses or support multiple addresses

2. **Vital Signs**: Stored as individual columns (not as JSON or separate table)
   - **Why**: Type-safe, queryable, common fields
   - **Trade-off**: Schema changes needed for new vital signs

3. **Appointment Type & Status**: Enums instead of reference tables
   - **Why**: Static list, doesn't change often, better type safety
   - **Trade-off**: Requires migration to add new types

## Performance Considerations

### Indexes
All foreign keys are indexed by default. Additional indexes on:
- Frequently queried fields (status, email, dates)
- Fields used in WHERE clauses
- Fields used in ORDER BY

### Query Optimization
1. **Select specific columns**: Don't use `SELECT *` in production
2. **Use pagination**: Limit large result sets
3. **Include strategy**: Use Prisma's `include` wisely
4. **Connection pooling**: Supabase provides PgBouncer pooling

### What Would Break First at 100x Data

**Current bottlenecks at scale**:

1. **Appointments table** - Most active table, high write volume
   - Solution: Partition by date, archive old appointments

2. **AuditLog table** - Grows fastest (every action logged)
   - Solution: Partition by month, move old logs to cold storage

3. **Alert generation** - Scans all appointments
   - Solution: Add compound index on `[status, scheduledAt]`

4. **Dashboard queries** - Complex aggregations
   - Solution: Materialized views or pre-aggregated tables

5. **Search queries** - Full-text search on patient names
   - Solution: Add full-text search indexes or use Elasticsearch

## Migration Strategy

### Development
```bash
# Create migration
npx prisma migrate dev --name description

# Apply migration
npx prisma migrate dev

# Reset database (WARNING: data loss)
npx prisma migrate reset
```

### Production
```bash
# Apply pending migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Migration Files
Located in `prisma/migrations/` with timestamp-based naming:
```
20260910105738_initial_schema/
20260910133332_add_visit_note_and_audit_history/
20260910155607_add_hipaa_audit_logging/
```

### Data Migrations
Changes to how existing data is *encoded* (not to the schema) live in `scripts/`:

```bash
# Dry run: prints each row's current and new value
npx tsx scripts/migrate-slot-times.ts

# Apply in a single transaction
npx tsx scripts/migrate-slot-times.ts --apply
```

`migrate-slot-times.ts` is idempotent and refuses to write if any slot would end
before it starts or collide with another under the unique index.

## Backup & Recovery

### Supabase Automatic Backups
- Daily backups (last 7 days)
- Point-in-time recovery (Pro plan)

### Manual Backups
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import database
psql $DATABASE_URL < backup.sql
```

### Audit Log Retention
For HIPAA compliance, audit logs should be retained for 7 years:
- Monthly export to secure storage
- Never delete from production database
- Implement archival strategy for old logs
