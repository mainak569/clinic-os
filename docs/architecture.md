# Architecture

## Overview

ClinicOS is a healthcare practice management application built with modern web technologies, following a layered architecture pattern with clear separation of concerns.

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5 with App Router
- **Language**: TypeScript 5 (strict mode)
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack React Query 5.102 (server state)
- **Charts**: Recharts 3.10
- **Calendar**: Custom week, month and list views

### Backend
- **Runtime**: Node.js 18.18+
- **API**: Next.js App Router (Server Actions + API Routes)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 5.22
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Password Hashing**: bcrypt.js (cost factor 10)

### Infrastructure
- **Hosting**: Vercel-ready (or self-hosted)
- **Database Hosting**: Supabase (PostgreSQL with connection pooling)
- **Error Tracking**: Sentry config files included, not initialised yet
- **Cron Jobs**: Vercel Cron (alert generation, daily on the Hobby plan)

## Application Architecture

### Layer Structure

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (React Components, Pages, Forms)       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         API/Action Layer                │
│  (Server Actions, API Routes)           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Service Layer                   │
│  (Business Logic, Validation)           │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Data Access Layer               │
│  (Prisma ORM, Database Queries)         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│         Database                        │
│  (PostgreSQL via Supabase)              │
└─────────────────────────────────────────┘
```

### Directory Structure

```
app/
├── layout.tsx            # Root layout: fonts, session and query providers, toaster
├── page.tsx              # Public landing page
├── actions/              # Server Actions: auth, validation, audit, then a service call
│   ├── appointment.actions.ts
│   ├── availability.actions.ts
│   ├── bulk-availability.actions.ts
│   ├── patient.actions.ts
│   ├── provider.actions.ts
│   ├── visit-note.actions.ts
│   ├── alert.actions.ts
│   ├── analytics.actions.ts
│   └── queries.actions.ts   # Read-only dashboard and table queries
├── api/                  # API Routes (same services as the UI)
│   ├── appointments/route.ts
│   ├── patients/route.ts
│   ├── providers/[providerId]/route.ts
│   ├── auth/[...nextauth]/route.ts
│   └── cron/generate-alerts/route.ts   # Called by the Vercel cron
├── dashboard/            # Protected app
│   ├── layout.tsx        # Shared header and navigation
│   ├── page.tsx          # Dashboard: quick actions, alerts, analytics
│   ├── appointments/
│   ├── patients/
│   ├── schedule/
│   └── providers/        # Front desk only
├── login/                # Authentication page
└── unauthorized/         # Access denied page

components/
├── ui/                   # shadcn/ui primitives
├── auth/                 # Login form
├── landing/              # Landing page sections (hero, features, CTA)
├── layout/               # Dashboard header, navbar, shared background
├── providers/            # React context providers (session, React Query)
├── appointments/         # Appointment table, dialogs, visit notes
├── availability/         # Bulk availability, schedule export
├── patients/             # Patient table and dialogs
├── provider-management/  # Providers table and dialog
├── schedule/             # Week / month / list views
└── dashboard/            # Analytics charts, alert panel

lib/
├── services/             # Business logic layer
│   ├── appointment.service.ts
│   ├── availability.service.ts
│   ├── bulk-availability.service.ts
│   ├── patient.service.ts
│   ├── provider.service.ts
│   ├── visit-note.service.ts
│   ├── alert.service.ts
│   ├── analytics.service.ts
│   └── audit.service.ts
├── validations/          # Zod schemas (shared by forms and actions)
├── errors/               # Custom error classes
├── hooks/
│   └── use-mutation.ts   # Mutation state, toasts; retries network and 5xx failures, never rejected writes
├── clinic-time.ts        # Slot time encoding and clinic timezone
├── appointment-status.ts # Status labels and colours
├── serialize.ts          # Decimal -> number before data reaches the client
├── action-error.ts       # Readable action error messages
├── revalidate.ts         # Dashboard-wide revalidation
├── auth-helpers.ts       # Authorization utilities (requireAuth, getApiSession, ...)
├── visit-note-permissions.ts # Who may write a visit note (mirrors the server rule)
├── rate-limit.ts         # Global rate limit and failed sign-in lockout
├── query-client.ts       # React Query client defaults
├── utils.ts              # cn() class-name helper
└── prisma.ts             # Prisma client (re-exports prisma.config.ts)

prisma/
├── schema.prisma         # Database schema (11 models)
├── migrations/           # Database migrations
└── seed.ts               # Seed data

scripts/
├── migrate-slot-times.ts # Data migration to canonical slot times (dry run by default)
├── fix-foreign-keys.ts   # Check (--check) or repair (--fix) broken foreign keys
├── quick-check.mjs       # Quick row counts for foreign-key sanity checks
└── clear-availability.ts # DELETES ALL availability slots (npm run delete-availability)

Root configuration
├── middleware.ts         # Route protection and global rate limiting
├── auth.ts               # NextAuth setup (credentials provider)
├── auth.config.ts        # Session and callback configuration
├── prisma.config.ts      # Prisma client singleton
├── next.config.js        # Security headers
├── vercel.json           # Cron schedule (daily)
├── jest.config.js        # Test configuration
└── sentry.*.config.ts    # Error tracking (client, server, edge)
```

## Request Flow

### Example: Creating an Appointment

```
1. User fills the form
   (components/appointments/create-appointment-dialog.tsx)
   Date and time are combined into one instant in the browser.

2. Form calls the Server Action
   (app/actions/appointment.actions.ts::createAppointment)

3. Server Action
   - requireAuth() and confirms the session user still exists
   - Zod validation (createAppointmentSchema)
   - canAccessProviderData(): providers may only book for themselves

4. Service Layer enforces business rules
   (lib/services/appointment.service.ts::createAppointment)
   - Not in the past (5-minute grace)
   - Patient exists and isn't archived; provider exists and is active
   - Provider is available: the instant is converted to the clinic's wall
     clock (weekday + minutes) and compared with that day's slots
   - Inside one transaction holding a per-provider advisory lock:
       conflict check (each existing visit measured by its own length)
       then insert, so concurrent requests can't both succeed
   - Appointment history entry (CREATED)

5. Server Action writes the audit log entry, then revalidates every
   route under /dashboard

6. Response returns { success, data } or { success: false, error }
   - Validation failures return the first issue's message, not raw JSON
   - Rejected writes are never retried by the client

7. UI updates
   - Toast notification
   - The table reloads its data
```

The same service backs `POST /api/appointments`, so API clients get identical rules.

## Authentication & Authorization

### Authentication System

**Technology**: NextAuth.js v5 (Auth.js)

**Session Management**:
- JWT-based sessions (stateless)
- HTTP-only cookies (XSS protection)
- 30-day session duration
- Encrypted with AUTH_SECRET (AES-256)

**Password Security**:
- bcrypt hashing (cost factor 10)
- Passwords never stored in plain text
- Salting handled automatically by bcrypt

**Authentication Flow**:
```
1. User enters credentials on /login page
2. Credentials sent to NextAuth API
3. Password verified against bcrypt hash
4. JWT session created and encrypted
5. HTTP-only cookie set with session
6. User redirected to /dashboard
```

### Authorization System

**Roles**:
- `PROVIDER`: Healthcare providers (doctors, nurses)
- `FRONT_DESK`: Administrative staff

**Authorization Model**:

| Resource | PROVIDER | FRONT_DESK |
|----------|----------|------------|
| Own appointments | Full | Full |
| Other appointments | None | Full |
| Own patients | Full | Full |
| All patients | None | Full |
| Analytics (dashboard) | Own data | View (all providers) |
| Alerts | Own only | None (alerts are per provider) |
| Provider management | Own details only | Full |

**Provider analytics**: `/dashboard` shows the analytics charts to every role.
For a PROVIDER, every analytics query (stat tiles, summary counts, the
Appointments by Status chart and the 8-week no-show trend) is filtered by
their `providerId`, and the cross-provider **Appointments by Provider** chart
is front desk only. A provider account with no linked provider is refused
rather than shown clinic-wide data.

**Authorization Helpers** (`lib/auth-helpers.ts`):
- `requireAuth()` - Require authentication
- `requireRole(role)` - Require specific role
- `canAccessProviderData(providerId)` - Check provider data access
- `requireProviderAccess(providerId)` - Enforce provider access
- `getApiSession()` - Session or null, for API routes that answer 401 themselves

**Middleware** (`middleware.ts`):
- Redirects signed-out users from dashboard pages to `/login`
- Global rate limiting (100 requests/minute per IP) on pages and sign-in
- Doesn't match other API routes: they, like every Server Action, check the session themselves

### Provider Isolation

Providers can only access their own data:

```typescript
// Example: Providers can only see their appointments
const appointments = await prisma.appointment.findMany({
  where: {
    providerId: session.user.providerId, // Enforced at query level
  },
});

// Front desk can see all appointments
const appointments = await prisma.appointment.findMany({
  where: session.user.role === 'FRONT_DESK' 
    ? {} 
    : { providerId: session.user.providerId },
});
```

## Database Schema

**11 Models** (numbered as in [schema.md](./schema.md)):

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

**Key Relationships**:
- User → Provider (1:1)
- Provider → ProviderProfile (1:1)
- Provider → AvailabilitySlots (1:many)
- Provider → Appointments (1:many)
- Patient → Appointments (1:many)
- Appointment → VisitNote (1:1)
- Appointment → AppointmentHistory (1:many)
- VisitNote → VisitNoteHistory (1:many)
- Provider → Alerts (1:many)
- User → AuditLogs (1:many)

See [schema.md](./schema.md) for detailed schema documentation.

## Service Layer Pattern

The service layer encapsulates business logic and enforces domain rules.

**Key Services**:

### AppointmentService (`lib/services/appointment.service.ts`)
- State machine enforcement (REQUESTED → CONFIRMED → CHECKED_IN → COMPLETED)
- Availability checking on the clinic wall clock
- Overlap detection and a per-provider booking lock
- Guards against past bookings, archived patients and inactive providers
- Appointment history entries

### PatientService (`lib/services/patient.service.ts`)
- Normalized email (lower-case) and trimmed fields
- Soft delete; re-registration restores the archived record
- Provider-scoped search filtered in the database

### ProviderService (`lib/services/provider.service.ts`)
- Creates User + Provider + ProviderProfile in one transaction
- Deactivation disables login and is refused with open appointments

### VisitNoteService (`lib/services/visit-note.service.ts`)
- History snapshot before every edit
- `undefined` leaves a field unchanged, `null` clears it

### AvailabilityService (`lib/services/availability.service.ts`)
- Slot management (create, update, archive, restore)
- Overlap detection
- Provider availability checking

## Clinic Time

Availability slots are recurring wall-clock times, not instants. They are
stored on `1970-01-01` in the UTC fields (09:00 → `1970-01-01T09:00:00.000Z`)
and travel between the browser and server as `"HH:MM"` strings. Appointments
remain real instants; before comparing, the server converts one to the clinic's
weekday and minutes after midnight using `CLINIC_TIMEZONE`
(`lib/clinic-time.ts`). The answer is therefore the same on a laptop in IST and
on a UTC host.

### AlertService (`lib/services/alert.service.ts`)
- Generate 24-hour alerts for requested appointments
- Generate 1-hour urgent alerts
- De-duplication by appointment id; times formatted in clinic time

### AuditService (`lib/services/audit.service.ts`)
- Log patient record views and all writes to patients, appointments, visit notes and providers
- Capture user, IP address and user agent
- Append-only (the app never updates or deletes entries)

**Service Pattern**:
```typescript
export class AppointmentService {
  // Business logic methods
  async createAppointment(data: CreateAppointmentInput) {
    // 1. Validate input
    // 2. Check business rules
    // 3. Perform database operations
    // 4. Create audit log
    // 5. Return result
  }
}

// Singleton instance
export const appointmentService = new AppointmentService();
```

Server Actions own authorization, input validation and audit logging; services own business rules and database writes.

## State Management

### Server State
- Tables and dialogs call Server Actions and reload after a successful mutation
- Server Actions call `revalidateDashboard()`, which revalidates every route under `/dashboard`
- TanStack React Query is configured app-wide
- Prisma Decimal values are flattened to numbers (`lib/serialize.ts`) before reaching client components

### Form State
- **React Hook Form** for form management
- **Zod** for runtime validation
- Type-safe form inputs via TypeScript

### UI State
- React `useState` and `useReducer` for local state
- Context API for theme/session data
- URL state for filters and pagination

## Security Features

### 1. Authentication Security
- bcrypt password hashing
- Failed sign-in lockout (5 attempts per email per 15 minutes) with one generic error message
- JWT session encryption
- HTTP-only cookies
- CSRF protection (built into NextAuth)

### 2. Authorization Security
- Backend-only authorization checks
- Provider data isolation
- Role-based access control
- Explicit permission checks

### 3. Application Security
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy; no CSP yet)
- Rate limiting (100 req/min per IP on pages and sign-in)
- Input validation (Zod schemas)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React escaping)

### 4. Audit Trail
- Patient reads and writes, every appointment transition (including cancel, no-show and reschedule), visit-note create/edit, and provider changes are logged
- User actions tracked
- IP address and user agent captured
- Immutable log entries

## Performance Considerations

### Database
- Connection pooling via Supabase (Transaction Pooler)
- Indexes on foreign keys and frequently queried fields
- Efficient queries using Prisma `select` and `include`

### Caching
- React Query caches server data
- Next.js automatic static optimization
- Edge caching for public pages

### Bundle Size
- Code splitting via Next.js dynamic imports
- Tree shaking for unused code
- First Load JS: ~260kB for dashboard

## Deployment Architecture

### Recommended: Vercel + Supabase

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Vercel    │
│  (Edge CDN) │
│             │
│ - Next.js   │
│ - Cron Jobs │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Supabase   │
│ (PostgreSQL)│
│             │
│ - Database  │
│ - Pooling   │
└─────────────┘
```

### Alternative: Self-Hosted

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   nginx     │
│ (Reverse    │
│  Proxy)     │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Node.js   │
│ (Next.js    │
│  Server)    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ PostgreSQL  │
│ (Database)  │
└─────────────┘
```

## What We Decided NOT to Build

### Billing & Payments
- Out of scope for MVP
- Would require PCI compliance
- Can integrate Stripe/Square later

### Electronic Health Records (EHR)
- Too complex for initial version
- Visit notes provide basic documentation
- Full EHR requires specialized features

### Telemedicine/Video Calls
- Requires video infrastructure
- Out of scope for appointment management focus

### Multi-clinic Support
- Single clinic deployment for MVP
- Can add organization hierarchy later

### Mobile Apps
- Responsive web app sufficient for MVP
- Native apps can be built later

### Fax Integration
- Legacy technology
- Not required for modern workflows

## Key Architectural Decisions

See [decisions.md](./decisions.md) for detailed rationale behind major technical choices.
