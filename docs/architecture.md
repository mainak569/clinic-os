# Architecture

## Overview

ClinicOS is a healthcare practice management application built with modern web technologies, following a layered architecture pattern with clear separation of concerns.

## Tech Stack

### Frontend
- **Framework**: Next.js 15.0.3 with App Router
- **Language**: TypeScript 5 (strict mode)
- **UI Library**: React 18.2
- **Styling**: Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- **Forms**: React Hook Form + Zod validation
- **State Management**: TanStack React Query 5.102 (server state)
- **Charts**: Recharts 3.10
- **Calendar**: FullCalendar 6.1

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js App Router (Server Actions + API Routes)
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 5.22
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Password Hashing**: bcrypt.js (cost factor 10)

### Infrastructure
- **Hosting**: Vercel-ready (or self-hosted)
- **Database Hosting**: Supabase (PostgreSQL with connection pooling)
- **Error Tracking**: Sentry (configured, not required)
- **Cron Jobs**: Vercel Cron (alert generation every 15 minutes)

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
├── actions/              # Server Actions (business logic entry points)
├── api/                  # API Routes (REST endpoints)
├── dashboard/            # Protected dashboard page
├── login/                # Authentication page
└── (other pages)

components/
├── ui/                   # shadcn/ui primitives
├── appointments/         # Appointment-specific components
├── availability/         # Scheduling components
├── dashboard/            # Dashboard widgets
└── ...

lib/
├── services/            # Business logic layer
│   ├── appointment.service.ts
│   ├── availability.service.ts
│   ├── alert.service.ts
│   ├── analytics.service.ts
│   └── audit.service.ts
├── validations/         # Zod schemas
├── errors/              # Custom error classes
├── auth-helpers.ts      # Authorization utilities
├── rate-limit.ts        # Rate limiting
└── prisma.ts            # Prisma client singleton

prisma/
├── schema.prisma        # Database schema (9 models)
├── migrations/          # Database migrations
└── seed.ts              # Seed data
```

## Request Flow

### Example: Creating an Appointment

```
1. User fills form in React component
   (components/appointments/create-appointment-form.tsx)
   
2. Form submits to Server Action
   (app/actions/appointment.actions.ts::createAppointment)
   
3. Server Action validates input
   - Zod schema validation
   - Authentication check (requireAuth)
   
4. Server Action calls Service Layer
   (lib/services/appointment.service.ts::createAppointment)
   
5. Service Layer enforces business rules
   - Check provider availability
   - Verify no conflicting appointments
   - Validate state machine rules
   - Create audit log entry
   
6. Service Layer uses Prisma to save data
   (prisma.appointment.create())
   
7. Response returns to client
   - Success: appointment data
   - Error: error message with details
   
8. UI updates
   - React Query invalidates cache
   - Component re-renders with new data
   - Toast notification shown
```

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
| Analytics | None | View |
| User management | None | Full |

**Authorization Helpers** (`lib/auth-helpers.ts`):
- `requireAuth()` - Require authentication
- `requireRole(role)` - Require specific role
- `canAccessProviderData(providerId)` - Check provider data access
- `requireProviderAccess(providerId)` - Enforce provider access

**Middleware Protection** (`middleware.ts`):
- Edge-level route protection
- Rate limiting enforcement
- Automatic redirects for unauthorized access

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

**9 Core Models**:

1. **User** - Authentication and user accounts
2. **Provider** - Healthcare provider profiles
3. **Patient** - Patient records
4. **Appointment** - Appointment scheduling
5. **AvailabilitySlot** - Provider availability
6. **VisitNote** - Clinical documentation
7. **Alert** - System notifications
8. **AuditLog** - Audit trail for compliance
9. **VisitNoteHistory** - Immutable visit note history

**Key Relationships**:
- User → Provider (1:1)
- Provider → Appointments (1:many)
- Patient → Appointments (1:many)
- Appointment → VisitNote (1:1)
- Provider → AvailabilitySlots (1:many)
- VisitNote → VisitNoteHistory (1:many)

See [schema.md](./schema.md) for detailed schema documentation.

## Service Layer Pattern

The service layer encapsulates business logic and enforces domain rules.

**Key Services**:

### AppointmentService (`lib/services/appointment.service.ts`)
- State machine enforcement (REQUESTED → CONFIRMED → CHECKED_IN → COMPLETED)
- Availability checking
- Conflict detection
- Business rule validation

### AvailabilityService (`lib/services/availability.service.ts`)
- Slot management (create, update, archive)
- Overlap detection
- Provider availability checking

### AlertService (`lib/services/alert.service.ts`)
- Generate 24-hour alerts for requested appointments
- Generate 1-hour urgent alerts
- Smart deduplication

### AuditService (`lib/services/audit.service.ts`)
- Log all PHI access
- Track user actions
- Immutable audit trail

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

## State Management

### Server State
- **TanStack React Query** for data fetching and caching
- Automatic refetching on window focus
- Optimistic updates for better UX
- Cache invalidation on mutations

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
- JWT session encryption
- HTTP-only cookies
- CSRF protection (built into NextAuth)

### 2. Authorization Security
- Backend-only authorization checks
- Provider data isolation
- Role-based access control
- Explicit permission checks

### 3. Application Security
- Security headers (X-Frame-Options, CSP, etc.)
- Rate limiting (100 req/min global)
- Input validation (Zod schemas)
- SQL injection prevention (Prisma parameterized queries)
- XSS prevention (React escaping)

### 4. Audit Trail
- All PHI access logged
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
- First Load JS: ~257kB for dashboard

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
