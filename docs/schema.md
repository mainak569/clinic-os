# Database Schema

## Overview

ClinicOS uses PostgreSQL (via Supabase) with Prisma ORM. The schema includes 9 core models designed for healthcare practice management with audit trail support.

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
- many:1 → User
- 1:1 → ProviderProfile
- 1:many → AvailabilitySlot
- 1:many → Appointment
- 1:many → Alert

**Indexes**:
- `userId`
- `firstName, lastName` (composite)

**Cascade**: Deleting User deletes Provider

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
- many:1 → Provider

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

### 5. AvailabilitySlot

Provider availability schedule.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String | PK, CUID | Unique identifier |
| providerId | String | FK, Indexed | Link to Provider |
| dayOfWeek | DayOfWeek | Enum | MONDAY-SUNDAY |
| startTime | DateTime | Required | Start time (time only) |
| endTime | DateTime | Required | End time (time only) |
| isActive | Boolean | Default: true | Slot active status |
| createdAt | DateTime | Auto | Record creation |
| updatedAt | DateTime | Auto | Last update |

**Relationships**:
- many:1 → Provider

**Indexes**:
- `providerId`
- `dayOfWeek`
- Unique constraint: `[providerId, dayOfWeek, startTime, endTime]`

**Cascade**: Deleting Provider deletes AvailabilitySlots

**Note**: startTime and endTime store time only. The date portion is ignored.

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

### 11. AuditLog

HIPAA-compliant audit trail.

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
   - Appointment.appointmentId in VisitNote
3. **Default Values**: Most timestamps, boolean flags, and enums have defaults
4. **Cascade Deletes**:
   - User → Provider → ProviderProfile, AvailabilitySlot, Appointment
   - Appointment → VisitNote → VisitNoteHistory
   - Appointment → AppointmentHistory

### Application-Level Constraints
1. **State Machine**: Appointment status transitions enforced in code
2. **Provider Isolation**: Providers can only access their own data
3. **Time Validation**: Appointments must be in provider's availability
4. **Conflict Detection**: Overlapping appointments prevented
5. **Audit Logging**: All PHI access must create audit log entry

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
20260910155607_add_hipaa_audit_logging/
  migration.sql
```

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
