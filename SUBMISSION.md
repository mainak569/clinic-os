# ClinicOS - Healthcare Practice Management Prototype

## Links

- **GitHub repository**: [github](https://github.com/mainak569/clinic-os)
- **Live application**: [vercel](https://clinic-os-352p.vercel.app/)

## Project Overview

ClinicOS is a healthcare practice management prototype built with Next.js 15, TypeScript, and PostgreSQL. Designed as a demonstration project with HIPAA-oriented security and auditability considerations for appointment scheduling, provider availability management, and clinical documentation.

**Important**: This is a student/prototype project for educational purposes. It demonstrates healthcare application architecture and security patterns but is not certified for production use with real patient data.

## Demo Credentials

After running `npm run db:seed`, log in with:

| Role       | Email                   | Password      | Access Level |
| ---------- | ----------------------- | ------------- | ------------ |
| FRONT_DESK | frontdesk@clinicos.com  | FrontDesk123! | Full system access |
| PROVIDER   | dr.smith@clinicos.com   | DrSmith123!   | Own appointments only |
| PROVIDER   | dr.johnson@clinicos.com | DrJohnson123! | Own appointments only |

## Tech Stack

| Layer    | Technology | Why |
| -------- | ---------- | --- |
| **Frontend** | Next.js 15, React 18, TypeScript 5 | Server Components for performance, type safety, modern React patterns |
| **UI** | Tailwind CSS, shadcn/ui, Radix UI | Responsive design, accessible components, glassmorphism effects |
| **Backend** | Next.js App Router, Server Actions | Type-safe API, simplified data mutations, edge-ready |
| **Database** | PostgreSQL (Supabase), Prisma ORM | Type-safe queries, managed hosting, connection pooling |
| **Auth** | NextAuth.js v5, bcrypt | Flexible auth system, secure password hashing, JWT sessions |
| **State** | TanStack React Query, React Hook Form | Server state management, optimistic updates, form validation |
| **Validation** | Zod | Runtime type checking, schema validation |
| **Charts** | Recharts | Healthcare analytics and reporting |
| **Testing** | Jest, ts-jest | Unit and integration testing |
| **Hosting** | Vercel-ready | Zero-config deployment, edge functions, cron jobs |

## Goal Checklist

| #   | Goal | Status | Notes |
| --- | ---- | ------ | ----- |
| 1   | User Authentication & Authorization | Complete | NextAuth.js v5 with JWT sessions, bcrypt hashing, role-based access (PROVIDER, FRONT_DESK), provider data isolation |
| 2   | Appointment Management System | Complete | State machine (6 states), duration-aware conflict detection, per-provider locking against concurrent double-booking, cancellation/no-show/reschedule tracking |
| 3   | Provider Scheduling & Availability | Complete | Recurring weekly slots stored as clinic wall-clock time, bulk creation, overlap detection, availability checking before booking, provider management (add/edit/deactivate) |
| 4   | Patient Record Management | Complete | Demographics, medical history, emergency contacts, search by name/email/phone, soft delete with restore on re-registration |
| 5   | Clinical Documentation (Visit Notes) | Complete | SOAP format, range-checked vital signs, clearable fields, immutable history, amendment system with user attribution |
| 6   | Alerts & Notifications System | Complete | 24-hour and 1-hour automated alerts, daily Vercel cron (Hobby plan limit), deduplication logic, dismissal tracking |
| 7   | Analytics Dashboard | Complete | Charts for appointments by provider/status, weekly no-show rates, live counts for today's appointments and check-ins |
| 8   | Audit Logging for HIPAA Compliance | Complete | HIPAA-oriented audit trail (demonstration): PHI access tracking, user action logging with IP/user agent, immutable audit log, retention-ready structure |
| 9   | Security Implementation | Complete | Rate limiting (100 req/min), security headers, Zod input validation, provider isolation, CSRF protection |
| 10  | Responsive UI & Landing Page | Complete | Mobile-first glassmorphism design, pricing/about/contact sections, sticky navigation, responsive across all devices |

**Overall Progress**: 10/10 goals completed (100%)

## Core Features Implemented

### Authentication & Authorization
- NextAuth.js v5 with credential-based login
- bcrypt password hashing (cost factor 10)
- JWT sessions with HTTP-only cookies
- Role-based access control (PROVIDER, FRONT_DESK)
- Provider data isolation enforcement
- Session management with 30-day expiry

### Appointment Management
- State machine with 6 states: REQUESTED → CONFIRMED → CHECKED_IN → COMPLETED, CANCELLED, NO_SHOW
- Appointment creation, confirmation, check-in, completion workflow
- Reason tracking for cancellations and no-shows
- Appointment type classification (CONSULTATION, FOLLOW_UP, PROCEDURE, EMERGENCY)
- Conflict detection that uses each existing visit's real duration
- Per-provider database lock so two simultaneous requests can't book the same slot
- Bookings rejected for past times, archived patients and inactive providers
- Back-to-back appointment support

### Provider Scheduling
- Recurring availability slots (weekly patterns), stored as clinic wall-clock time so hours don't shift between browser and server timezones
- Manual slot creation and management
- Bulk availability creation tool
- Slot overlap detection
- Availability conflict checking
- Slot archiving (soft delete)
- Schedule export functionality

### Provider Management
- Front desk can add providers: login, provider record and profile created together in one transaction
- Edit name, title, email, password and scheduling defaults
- Deactivate (disables login and booking; refused while appointments are open) and reactivate

### Patient Management
- Patient demographics (name, DOB, contact)
- Medical history tracking
- Emergency contact information
- Patient search by name, email or phone
- Emails normalised so different casing counts as the same patient
- Soft delete; registering the same person again restores their archived record and history
- Patient record linking to appointments

### Clinical Documentation
- Visit notes with SOAP format (Subjective, Objective, Assessment, Plan)
- Vital signs tracking (BP, HR, temp, weight, height) with clinically plausible ranges that match the database column precision
- Chief complaint documentation
- Diagnosis and treatment plan recording
- Immutable visit note history
- Amendment tracking with user attribution

### Alerts & Notifications
- Automated 24-hour alerts for requested appointments
- 1-hour urgent alerts before appointments
- Alert deduplication logic
- Cron job for alert generation (daily on Vercel Hobby; runs more often on paid plans)
- Alert dismissal and acknowledgment

### Analytics Dashboard
- Appointments by provider (bar chart)
- Appointments by status (pie chart)
- No-show rate tracking (last 8 weeks)
- Today's appointments, check-ins and weekly no-shows counted from the database

### Audit Logging
- HIPAA-oriented audit trail structure (demonstration purposes)
- PHI access event tracking
- User action logging with IP and user agent
- Immutable audit log design
- 7-year retention capability (structure in place, automation not implemented)

### Security Features
- Security headers configured (XSS, clickjacking protection)
- Rate limiting (100 requests/minute, memory-based for single server)
- Input validation with Zod schemas
- SQL injection prevention (Prisma parameterized queries)
- CSRF protection (NextAuth built-in)
- Error sanitization (no PHI in error messages)

### Responsive Landing Page
- Modern glassmorphism design
- Fully responsive (mobile, tablet, desktop)
- Pricing section with 3 tiers
- About section with company info
- Contact section with demo accounts
- Features showcase
- Hero section with CTAs
- Sticky navigation header
- Minimal footer design

## Project Structure

```
clinic-os/
├── app/
│   ├── actions/           # Server Actions (API layer)
│   ├── api/               # REST API routes
│   ├── dashboard/         # Protected dashboard (appointments, patients, schedule, providers)
│   ├── login/             # Auth pages
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── appointments/      # Appointment components
│   ├── availability/      # Scheduling components
│   ├── dashboard/         # Analytics widgets
│   ├── landing/           # Landing page sections
│   ├── patients/          # Patient table and dialogs
│   ├── provider-management/ # Providers table and form
│   ├── schedule/          # Schedule views
│   └── layout/            # Navigation, shared background
├── lib/
│   ├── services/          # Business logic layer
│   ├── validations/       # Zod schemas
│   ├── errors/            # Custom error classes
│   ├── clinic-time.ts     # Wall-clock time helpers for availability
│   ├── auth-helpers.ts    # Authorization utilities
│   └── prisma.ts          # Database client
├── prisma/
│   ├── schema.prisma      # Database schema (11 models)
│   ├── migrations/        # Migration history
│   └── seed.ts            # Demo data seeding
├── scripts/
│   └── migrate-slot-times.ts # Data migration for availability slot times
├── __tests__/
│   ├── unit/              # Unit tests (60 passing)
│   └── integration/       # Integration tests (55 passing)
└── docs/                  # Architecture, decisions, schema
```

## Database Schema

11 models with proper relationships:

1. **User** - Authentication and authorization
2. **Provider** - Healthcare providers
3. **ProviderProfile** - Specialization, license, contact and scheduling defaults
4. **Patient** - Patient records
5. **Appointment** - Appointment scheduling
6. **AppointmentHistory** - Immutable appointment change history
7. **AvailabilitySlot** - Provider availability
8. **VisitNote** - Clinical documentation
9. **VisitNoteHistory** - Immutable note history
10. **Alert** - System notifications
11. **AuditLog** - Compliance logging

## Testing Status

- **Unit Tests**: 60/60 passing (100%)
  - Validation schemas (13 tests)
  - Appointment service business logic (25 tests)
  - Authorization helpers (13 tests)
  - Clinic-time conversions (9 tests)

- **Integration Tests**: 55/55 passing (100%)
  - Security and unauthorized access (15 tests)
  - Appointment state machine (12 tests)
  - Authorization and access control (12 tests)
  - Duplicate booking prevention (10 tests)
  - Appointment workflow (6 tests)

**Total: 115/115 tests passing**

Unit tests mock the database. Integration tests run against a local PostgreSQL test database (`clinicos_test`) with mocked authentication, never against Supabase.

## Build & Deployment Status

- **Build**: Passes successfully (`npm run build`)
- **Type checking**: No TypeScript errors (`npx tsc --noEmit`)
- **Linting**: ESLint passes (`npm run lint`)
- **Tests**: All 115 tests passing (`npm test`)
- **Deployment**: Vercel-ready with environment variable template (set `CLINIC_TIMEZONE`)
- **Demo**: Live at [vercel](https://clinic-os-352p.vercel.app/)

**Note**: This is a demonstration deployment. Not for production use with real patient data.

## What's Working

### Complete Workflows
1. User Authentication: Login → Session → Dashboard → Logout
2. Appointment Lifecycle: Create → Confirm → Check-in → Complete (with state validation)
3. Provider Scheduling: Create slots → Check availability → Book appointments
4. Provider Management: Add provider → Edit profile → Deactivate / Reactivate
5. Clinical Documentation: Create visit notes → View history → Track amendments
6. Analytics: Dashboard with live daily counts and trend charts
7. Audit Trail: Patient, appointment, visit note and provider changes logged with full context

### Authorization
- Providers can only see their own appointments and patients
- Front desk can manage all appointments across all providers
- Backend authorization enforced (not just UI hiding)
- Middleware protects all routes

### Data Integrity
- No double-booking: overlap detection uses each visit's real duration, and bookings for one provider are serialized with a database lock
- State machine prevents invalid transitions
- Availability checked on the clinic's wall clock, independent of server timezone
- No bookings in the past, for archived patients, or for inactive providers
- Deleted patients can be re-registered without unique-constraint errors
- Decimal vitals and costs converted before reaching the browser
- Audit logging captures patient, appointment, visit note and provider changes

## Known Limitations

This is a prototype/demonstration project with the following limitations:

1. **Not HIPAA Certified**: Security patterns follow HIPAA principles, but no formal compliance validation
2. **Email Notifications**: Not implemented (alerts shown in UI only)
3. **Password Complexity**: Minimum length only (no complexity enforcement, though bcrypt hashing works)
4. **Session Timeout**: No inactivity timeout (30-day expiry only)
5. **Rate Limiting**: Memory-based (single server, not Redis-backed for distributed systems)
6. **Pagination**: Basic implementation, may have performance issues with large datasets (>1000 records)
7. **Search**: Patient name, email or phone; no full-text search capabilities
8. **File Upload**: Not implemented for visit notes attachments
9. **Multi-Clinic**: Single clinic deployment only
10. **Audit Log Retention**: No automated retention policy or archival system
11. **Backup/Recovery**: No automated backup system included
12. **Alert Linking**: Alerts reference appointments through an ID in the message text, not a foreign key
13. **Single Timezone**: One clinic timezone per deployment

## Time Spent

**Total**: Approximately 40-44 hours

Breakdown:
- Planning & Architecture: 3 hours
- Database Schema Design: 2 hours
- Authentication System: 4 hours
- Appointment Management: 8 hours
- Provider Scheduling: 4 hours
- Visit Notes & Clinical: 3 hours
- Analytics Dashboard: 3 hours
- Audit Logging: 2 hours
- Landing Page & UI: 4 hours
- Testing (Unit + Integration): 5 hours
- Documentation: 2 hours
- Bug fixes & Refactoring: 4 hours

## What Would You Do Next, With Another 12 Hours?

### Priority 1: Email Notifications (4 hours)
- Integrate Resend or SendGrid
- Email templates for appointment confirmations
- Alert emails for 24-hour and 1-hour reminders
- Email queue for reliability

### Priority 2: Production Hardening (4 hours)
- Redis-based rate limiting for multi-server
- Session inactivity timeout (15 minutes)
- Password complexity requirements (regex validation)
- Structured error logging with Sentry
- Database query performance optimization

### Priority 3: Enhanced UX (3 hours)
- Loading states and skeletons
- Optimistic updates for faster perceived performance
- Better error messages and recovery flows
- Toast notifications for all actions
- Keyboard shortcuts for power users

### Priority 4: Additional Features (1 hour)
- File upload for visit notes attachments
- Advanced patient search with filters
- Appointment reminders via SMS
- Provider calendar synchronization

## What Are You Least Happy With in This Codebase, and Why?

### 1. Rate Limiting Implementation
**Why**: Using in-memory Map for rate limiting means it only works on single server. Doesn't scale horizontally and loses state on restart.

**Impact**: Can't deploy to multiple instances. Brute force attacks could succeed by hitting different servers.

**Fix**: Migrate to Redis-based rate limiting with `@upstash/ratelimit` or similar.

---

### 2. No Real Pagination
**Why**: Using `take` and `skip` in Prisma queries, but no cursor-based pagination. Will be slow with large datasets.

**Impact**: Dashboard and appointment lists will degrade with 1000+ appointments.

**Fix**: Implement cursor-based pagination with TanStack Query infinite queries.

---

### 3. Service Layer Coupling to Prisma
**Why**: Services directly use Prisma Client, making it hard to mock in tests and creating tight coupling.

**Impact**: Unit testing services requires test database. Hard to switch ORMs later.

**Fix**: Introduce repository pattern with interfaces, inject dependencies.

---

### 4. Limited Error Handling in UI
**Why**: Validation errors now return a single readable message, and failed saves are no longer retried automatically (retrying a rejected write could only repeat the rejection). But there are still no retry buttons or offline detection.

**Impact**: Users see what went wrong, but recovery after a network failure is still manual.

**Fix**: Retry buttons for network failures, offline detection, clearer recovery paths.

---

### 5. No Email Notifications
**Why**: Alerts are only shown in the UI dashboard. No actual email or SMS notifications sent.

**Impact**: Users must log in to see appointment reminders. Defeats the purpose of automated alerts.

**Fix**: Integrate email service (Resend/SendGrid) with transactional email templates.

## Backend / Frontend / Database Consistency Pass

A full audit compared the Prisma schema, Zod validation, services, server actions, API routes and forms. Issues found and fixed:

| Area | Inconsistency | Fix |
| ---- | ------------- | --- |
| Availability | Slot times stored in two encodings and read in the server's timezone; seeded 8 AM hours displayed as 1:30 PM | Canonical wall-clock encoding, clinic timezone setting, data migration of existing slots |
| Appointments | 15-min booking accepted inside a 60-min visit | Overlap check uses each visit's own duration |
| Appointments | Two simultaneous bookings for the same slot could both succeed | Per-provider advisory lock around check + insert |
| Appointments | Past bookings, archived patients and inactive providers accepted | Rejected with clear messages |
| Appointments | `POST /api/appointments` skipped validation, availability, conflicts and audit | Routed through the service layer |
| Appointments | Cancel, no-show and reschedule not audit-logged | Audit entries added |
| Patients | Re-registering a deleted patient failed on the unique email/phone index | Archived record restored with new details |
| Patients | Email uniqueness was case-sensitive | Emails normalised |
| Patients | Provider patient list filtered after pagination (wrong totals, unreachable pages) | Filter moved into the database query |
| Providers | No way to add or manage providers outside the seed script | Providers page, service and validated API |
| Visit notes | No range limits (database overflow errors), fields couldn't be cleared, Decimal vitals couldn't reach the browser | Bounds, nullable updates, serialization |
| App-wide | Validation errors shown as raw JSON; failed saves retried 3 times; revalidation targeted non-existent routes | Readable messages, no retries of rejected writes, correct revalidation |

## Architecture Highlights

### Service Layer Pattern
Business logic separated from HTTP/action layer for testability and reusability.

### State Machine for Appointments
Explicit states and transitions prevent invalid workflows (can't complete without check-in).

### Provider Isolation
Database-level filtering ensures providers can never access other providers' data, including patient search, which is filtered in the query so pagination and totals stay correct.

### Concurrency-Safe Booking
The conflict check and the insert run inside one transaction holding a per-provider Postgres advisory lock, so two simultaneous requests for the same slot can't both succeed. Verified through the Supabase connection pooler.

### Clinic Wall-Clock Time
Availability slots store wall-clock time on a fixed date; appointments are converted to the clinic's timezone before comparison. The same answer on a laptop and on a UTC server.

### Audit Trail
Every PHI access logged with user, timestamp, IP, and action for HIPAA compliance.

### Type Safety
End-to-end TypeScript with Zod runtime validation and Prisma generated types.

## Notes for Reviewer

- **Development**: Run `npm install`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run db:seed`, then `npm run dev`
- **Testing**: All 115 tests passing (60 unit + 55 integration). Integration tests need a local PostgreSQL `clinicos_test` database
- **Build**: Passes successfully, ready for Vercel deployment
- **Demo Data**: Seed creates 3 users, 2 providers, 5 patients, 5 appointments, 18 availability slots, 1 visit note and 3 alerts
- **Documentation**: See `/docs` for architecture, decisions, schema details and the development plan
- **Environment**: Set `CLINIC_TIMEZONE` (defaults to `Asia/Kolkata`) wherever the app runs
- **Code Quality**: TypeScript strict mode, ESLint passing, Prettier formatting

**Project Positioning**: This is a demonstration of healthcare application architecture and security patterns. It shows HIPAA-oriented design considerations but is not a certified, production-ready system for handling real patient data. Suitable as a portfolio/learning project or starting point for a production application that would require additional security hardening, compliance validation, and operational infrastructure.
