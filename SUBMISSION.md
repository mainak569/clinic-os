# ClinicOS - Healthcare Practice Management Prototype

## Links

- **GitHub repository**: [github](https://github.com/mainak569/clinic-os)
- **Live application**: [vercel](https://clinic-os-352p.vercel.app/)

## Project Overview

ClinicOS is a healthcare practice management prototype built with Next.js 15, TypeScript, and PostgreSQL. Designed as a demonstration project with HIPAA-oriented security and auditability considerations for appointment scheduling, provider availability management, and clinical documentation.

**Important**: This is a student/prototype project for educational purposes. It demonstrates healthcare application architecture and security patterns but is not certified for production use with real patient data.

**Engineering highlights** (details under [Architecture Highlights](#architecture-highlights)):
- Double-booking is prevented by a per-provider Postgres advisory lock around a duration-aware conflict check, verified with concurrent requests through the Supabase pooler
- Availability is stored as clinic wall-clock time, so schedules stay correct on a UTC server
- Provider isolation is enforced server-side in actions, queries and API routes, and covered by unit and integration tests
- 157 automated tests (102 unit, 55 integration against PostgreSQL)

## Demo Credentials

After running `npm run db:seed`, log in with:

| Role       | Email                   | Password      | Access Level |
| ---------- | ----------------------- | ------------- | ------------ |
| FRONT_DESK | frontdesk@clinicos.com  | FrontDesk123! | Full system access |
| PROVIDER   | dr.smith@clinicos.com   | DrSmith123!   | Own appointments only |
| PROVIDER   | dr.johnson@clinicos.com | DrJohnson123! | Own appointments only |

## Review This in 5 Minutes

A walkthrough of the core flow on freshly seeded data. Run `npm run db:seed` and `npm run dev`, then follow the steps at `http://localhost:3000`.

> **Timezone:** the booking form reads the time you enter in your browser's timezone, and availability is checked in `CLINIC_TIMEZONE` (default `Asia/Kolkata`). Use a browser in the clinic's timezone, or set `CLINIC_TIMEZONE` to yours before starting the server.

1. **Sign in as front desk.**
   - URL: http://localhost:3000/login
   - Account: **Front Desk** (`frontdesk@clinicos.com` / `FrontDesk123!`). Clicking the row under "Demo Credentials" fills the form.
   - Click **Sign In**. You land on http://localhost:3000/dashboard.

2. **Create an appointment** (front desk).
   - URL: http://localhost:3000/dashboard/appointments, then click **New Appointment**.
   - Patient **Emily Chen**, provider **Dr. Sarah Smith**, a weekday at least two days from today, time **11:00**, duration **30 minutes**, any type, and a reason.
   - Click **Create Appointment**. It appears in the table as **Requested**.
   - Dr. Smith's seeded availability is Monday–Friday, 9:00–12:00 and 13:00–17:00.

3. **Get blocked from double-booking** (front desk).
   - Same page: click **New Appointment** again.
   - Patient **James Garcia**, **Dr. Sarah Smith**, the same date, time **11:15**, duration **30 minutes**.
   - Click **Create Appointment**. The dialog shows: *"This time slot conflicts with an existing appointment. Please choose a different time."*
   - 11:15 falls inside the 11:00 visit rather than matching its start time, so this exercises the duration-aware overlap check. Close the dialog.

4. **Confirm and check in** (front desk).
   - In Emily Chen's row, open the actions menu (**⋯**) and click **Confirm**. The status becomes **Confirmed**.
   - Open **⋯** again and click **Check In**. The status becomes **Checked In**.
   - Check-in is only offered from Confirmed. The state machine rejects Requested → Checked In.

5. **Write a visit note** (Dr. Smith).
   - Sign out, then sign in at http://localhost:3000/login as **Provider 1** (`dr.smith@clinicos.com` / `DrSmith123!`).
   - URL: http://localhost:3000/dashboard/appointments. On Emily Chen's appointment, open **⋯**, click **View Details**, then the **Visit Note** tab.
   - Fill in a few SOAP fields (for example Assessment and Plan) and a vital such as Heart Rate, then click **Create Visit Note**.
   - Only the appointment's own provider gets the form. Front desk sees the tab read-only, and the server refuses notes from anyone else.

6. **View the audit trail** (Dr. Smith, or front desk).
   - Same dialog, **History** tab: **CREATED**, **CONFIRMED** and **CHECKED IN**, each with a timestamp and who performed it (`frontdesk@clinicos.com`).
   - **Visit Note** tab: **Edit Note**, then **Save Changes**. This records a version under the note's own **History** tab. Earlier versions are kept, not overwritten.
   - The full security audit log (every create and update on appointments and visit notes, with user, IP address and user agent) is stored in the `AuditLog` table and has no screen in the app. Run `npm run db:studio` and open **AuditLog** to inspect it.

The same paths work on the live deployment, but step 5 needs the build that includes the visit-note permission fix in `components/appointments/appointment-details-dialog.tsx`.

## Tech Stack

| Layer    | Technology | Why |
| -------- | ---------- | --- |
| **Frontend** | Next.js 15, React 18, TypeScript 5 | Server Components for performance, type safety, modern React patterns |
| **UI** | Tailwind CSS, shadcn/ui, Radix UI | Responsive design, accessible components, glassmorphism effects |
| **Backend** | Next.js App Router, Server Actions | Type-safe API, simplified data mutations, edge-ready |
| **Database** | PostgreSQL (Supabase), Prisma ORM | Type-safe queries, managed hosting, connection pooling |
| **Auth** | NextAuth.js v5, bcrypt | Flexible auth system, secure password hashing, JWT sessions |
| **State** | TanStack React Query, React Hook Form | Query client configured app-wide, form validation |
| **Validation** | Zod | Runtime type checking, schema validation |
| **Charts** | Recharts | Healthcare analytics and reporting |
| **Testing** | Jest, ts-jest | Unit and integration testing |
| **Hosting** | Vercel-ready | Zero-config deployment, daily cron job |

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
| 8   | HIPAA-Oriented Audit Logging | Complete | HIPAA-oriented audit trail (demonstration): patient record views and all changes to patients, appointments, visit notes and providers, with user, IP and user agent. No in-app audit viewer or retention automation |
| 9   | Security Implementation | Complete | Rate limiting (100 req/min per IP on pages and sign-in), failed sign-in lockout, security headers, Zod validation before writes, server-side provider isolation, 401s from API routes without a session |
| 10  | Responsive UI & Landing Page | Complete | Glassmorphism design, pricing/about/demo-account sections, sticky navigation, responsive layout |

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
- Appointment type classification (NEW_PATIENT, FOLLOW_UP, CONSULTATION, PROCEDURE, EMERGENCY)
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
- Vital signs tracking (BP, HR, temperature, respiratory rate, O2 saturation, weight, height) with clinically plausible ranges that match the database column precision
- Chief complaint documentation
- Diagnosis and treatment plan recording
- Immutable visit note history
- Amendment tracking with user attribution

### Alerts & Notifications
- Automated 24-hour alerts for unconfirmed (REQUESTED) appointments
- Urgent alerts for appointments still unconfirmed 1 hour before they start
- De-duplication, so repeated runs don't create the same alert twice
- Cron job for alert generation (daily on Vercel Hobby, protected by `CRON_SECRET`)
- Alert dismissal and mark-as-read, limited to the provider who owns the alert
- Appointment times in alerts shown in the clinic's timezone

### Analytics Dashboard
- Appointments by provider (bar chart)
- Appointments by status (pie chart)
- No-show rate tracking (last 8 weeks)
- Today's appointments, check-ins and weekly no-shows counted from the database

### Audit Logging
- HIPAA-oriented audit trail (demonstration purposes)
- Patient record views logged as READ events
- Creates, updates and deletes logged for patients, appointments, visit notes and providers, with IP and user agent
- Append-only: the app never updates or deletes audit rows
- No retention automation or in-app viewer (inspect with Prisma Studio)

### Security Features
- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (no Content-Security-Policy yet)
- Rate limiting: 100 requests/minute per IP on pages and sign-in (memory-based, per instance)
- Failed sign-in lockout: 5 failures lock an email for 15 minutes, and every failure returns the same generic message
- Input validation with Zod schemas before database writes
- SQL injection prevention (Prisma parameterized queries)
- CSRF protection (NextAuth for sign-in, Next.js origin checks for Server Actions)
- API routes answer 401 without a session; the cron endpoint requires `CRON_SECRET` in production
- Clients get readable messages, never stack traces

### Responsive Landing Page
- Modern glassmorphism design
- Fully responsive (mobile, tablet, desktop)
- Pricing section with 3 tiers
- About section with company info
- Demo section listing the demo accounts
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
│   ├── unit/              # Unit tests (102 passing)
│   └── integration/       # Integration tests (55 passing)
└── docs/                  # Architecture, decisions, schema
```

## Database Schema

11 models with proper relationships (numbered as in [docs/schema.md](./docs/schema.md)):

1. **User** - Authentication and authorization
2. **Provider** - Healthcare providers
3. **ProviderProfile** - Specialization, license, contact and scheduling defaults
4. **Patient** - Patient records
5. **AvailabilitySlot** - Provider availability
6. **Appointment** - Appointment scheduling
7. **VisitNote** - Clinical documentation
8. **VisitNoteHistory** - Immutable note history
9. **AppointmentHistory** - Immutable appointment change history
10. **Alert** - System notifications
11. **AuditLog** - Compliance logging

## Testing Status

- **Unit Tests**: 102/102 passing (100%)
  - Validation schemas (13 tests)
  - Appointment service business logic (25 tests)
  - Authorization helpers (13 tests)
  - Clinic-time conversions (9 tests)
  - Analytics provider isolation (12 tests)
  - Appointment details view: visit-note permission, history loading, provider isolation (10 tests)
  - API route and cron authentication (11 tests)
  - Alerts and hardening: de-duplication, alert ownership, provider accounts without a linked provider, sign-in lockout (9 tests)

- **Integration Tests**: 55/55 passing (100%)
  - Security and unauthorized access (15 tests)
  - Appointment state machine (12 tests)
  - Authorization and access control (12 tests)
  - Duplicate booking prevention (10 tests)
  - Appointment workflow (6 tests)

**Total: 157/157 tests passing**

Unit tests mock the database. Integration tests run against a local PostgreSQL test database (`clinicos_test`) with mocked authentication, never against Supabase.

## Build & Deployment Status

- **Build**: Passes successfully (`npm run build`)
- **Type checking**: No TypeScript errors (`npx tsc --noEmit`)
- **Linting**: ESLint passes (`npm run lint`)
- **Tests**: All 157 tests passing (`npm test`)
- **Deployment**: Vercel-ready with environment variable template (set `CLINIC_TIMEZONE` and `CRON_SECRET`)
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
- Middleware redirects signed-out users away from dashboard pages; every Server Action and API route checks the session itself

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
3. **Password Complexity**: Minimum 8 characters for new provider accounts; no complexity rules (bcrypt hashing throughout)
4. **Session Timeout**: No inactivity timeout (30-day expiry only)
5. **Rate Limiting**: Memory-based and per server instance (not Redis-backed); API routes other than sign-in aren't rate limited
6. **Pagination**: Basic implementation, may have performance issues with large datasets (>1000 records)
7. **Search**: Patient name, email or phone; no full-text search capabilities
8. **File Upload**: Not implemented for visit notes attachments
9. **Multi-Clinic**: Single clinic deployment only
10. **Audit Log Retention**: No automated retention policy or archival system
11. **Backup/Recovery**: No automated backup system included
12. **Alert Linking**: Alerts reference appointments through an ID in the message text, not a foreign key
13. **Single Timezone**: One clinic timezone per deployment; dashboard "today" counts use the server's day boundaries (UTC on Vercel)
14. **Alert Cadence**: The Vercel cron runs once a day (Hobby plan limit), so the 1-hour urgent alert only fires if the job runs inside that window
15. **Error Tracking**: Sentry config files are included, but Sentry isn't initialised

## Time Spent

**Total**: Approximately 40-44 hours

Breakdown (matches the sessions in [docs/plan.md](./docs/plan.md)):
- Foundation, setup and landing page: 3 hours
- Database and authentication: 5 hours
- Appointments (state machine, conflict detection): 6 hours
- Scheduling and availability: 5 hours
- Visit notes: 4 hours
- Alerts: 3 hours
- Analytics dashboard: 4 hours
- Testing: 6 hours
- Security and audit logging: 5 hours
- Polish and documentation: 3 hours

The later UI consistency pass, data-integrity audit and final review weren't timed.

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
- Initialise Sentry (the config files exist but aren't wired in) for structured error logging
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
**Why**: Services import the Prisma client directly, creating tight coupling.

**Impact**: Unit tests have to mock the whole `@/lib/prisma` module, and anything that depends on real SQL (the advisory lock, overlap queries) needs the integration test database. Hard to switch ORMs later.

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
| Analytics | A provider's dashboard showed the whole clinic's status breakdown and no-show trend; standalone analytics actions returned clinic-wide data to any signed-in user | Every analytics query filtered by the provider's ID; cross-provider chart front-desk only; provider accounts without a linked provider refused |
| Visit notes | The details dialog hard-coded the note form hidden, so no provider could write a note; the History tab never loaded; any signed-in user could open any appointment's details by id | Form shown to the appointment's own provider; history loaded with safe user fields; provider isolation on the details query |
| Alerts | De-duplication never matched, so repeat runs duplicated alerts; any user could mark or dismiss another provider's alert by id; times formatted in the server's timezone | De-duplicate on the appointment id; updates scoped to the owner; clinic-timezone formatting |
| Auth & API | Signed-out API calls returned 500 or 409 "NEXT_REDIRECT"; sign-in revealed deactivated accounts and was never throttled; the cron endpoint was open without a secret | 401 from API routes; one generic sign-in error plus a failed-attempt lockout; `CRON_SECRET` required in production |
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
Patient record views and changes to patients, appointments, visit notes and providers are logged with user, timestamp, IP and user agent. This follows HIPAA-oriented audit practices but is not compliance-certified.

### Type Safety
End-to-end TypeScript with Zod runtime validation and Prisma generated types.

## Notes for Reviewer

- **Development**: Copy `.env.example` to `.env` and fill it in, then run `npm install`, `npx prisma migrate deploy`, `npm run db:seed` and `npm run dev`
- **Testing**: All 157 tests passing (102 unit + 55 integration). Integration tests need a local PostgreSQL `clinicos_test` database
- **Build**: Passes successfully, ready for Vercel deployment
- **Demo Data**: Seed creates 3 users, 2 providers, 5 patients, 5 appointments, 18 availability slots, 1 visit note and 3 alerts
- **Documentation**: See `/docs` for architecture, decisions, schema details and the development plan
- **Environment**: Set `CLINIC_TIMEZONE` (defaults to `Asia/Kolkata`) wherever the app runs, and `CRON_SECRET` on Vercel
- **Code Quality**: TypeScript strict mode, ESLint passing, Prettier formatting

**Project Positioning**: This is a demonstration of healthcare application architecture and security patterns. It shows HIPAA-oriented design considerations but is not a certified, production-ready system for handling real patient data. Suitable as a portfolio/learning project or starting point for a production application that would require additional security hardening, compliance validation, and operational infrastructure.
