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
- 179 automated tests (117 unit, 62 integration against PostgreSQL)

## Demo Credentials

Sign in on the [live application](https://clinic-os-352p.vercel.app/login), or on a local copy after running `npm run db:seed`, with:

| Role       | Email                   | Password      | Access Level |
| ---------- | ----------------------- | ------------- | ------------ |
| FRONT_DESK | frontdesk@clinicos.com  | FrontDesk123! | Full system access |
| PROVIDER   | dr.smith@clinicos.com   | DrSmith123!   | Own appointments only |
| PROVIDER   | dr.johnson@clinicos.com | DrJohnson123! | Own appointments only |

## Tech Stack

| Layer    | Technology | Why |
| -------- | ---------- | --- |
| **Frontend** | Next.js 15, React 18, TypeScript 5 | Server Components for performance, type safety, modern React patterns |
| **UI** | Tailwind CSS, shadcn/ui, Radix UI, ogl | Responsive design, accessible components, glassmorphism over an animated WebGL background |
| **Backend** | Next.js App Router, Server Actions | Type-safe API, simplified data mutations, edge-ready |
| **Database** | PostgreSQL (Supabase), Prisma ORM | Type-safe queries, managed hosting, connection pooling |
| **Auth** | NextAuth.js v5, bcrypt | Flexible auth system, secure password hashing, JWT sessions |
| **State** | TanStack React Query, React Hook Form | Query client configured app-wide, form validation |
| **Validation** | Zod | Runtime type checking, schema validation |
| **Charts** | Recharts | Dashboard bars, donut and area charts, each with a screen-reader table |
| **Testing** | Jest, ts-jest | Unit and integration testing |
| **Hosting** | Vercel-ready | Zero-config deployment, daily cron job |

## Goal Checklist

| #   | Goal | Status | Notes |
| --- | ---- | ------ | ----- |
| 1   | User Authentication & Authorization | Complete | NextAuth.js v5 with JWT sessions, bcrypt hashing, role-based access (PROVIDER, FRONT_DESK), provider data isolation |
| 2   | Appointment Management System | Complete | State machine (6 states), duration-aware conflict detection, per-provider locking against concurrent double-booking, cancellation/no-show/reschedule tracking, time rules for check-in, completion, no-shows and cancellation |
| 3   | Provider Scheduling & Availability | Complete | Recurring weekly slots stored as clinic wall-clock time, bulk creation, overlap detection, availability checking before booking, provider management (add/edit/deactivate) |
| 4   | Patient Record Management | Complete | Demographics, medical history, emergency contacts, search by name/email/phone, soft delete with restore on re-registration |
| 5   | Clinical Documentation (Visit Notes) | Complete | SOAP format, range-checked vital signs, clearable fields, immutable history, amendment system with user attribution |
| 6   | Alerts & Notifications System | Complete | 24-hour and 1-hour automated alerts, daily Vercel cron (Hobby plan limit), deduplication logic, dismissal tracking |
| 7   | Analytics Dashboard | Complete | Appointments by provider (bars) and status (donut), 8-week no-show trend, live counts for today's appointments and check-ins; colour-blind-checked status colours and screen-reader tables |
| 8   | HIPAA-Oriented Audit Logging | Complete | HIPAA-oriented audit trail (demonstration): patient record views and all changes to patients, appointments, visit notes and providers, with user, IP and user agent. No in-app audit viewer or retention automation |
| 9   | Security Implementation | Complete | Rate limiting (100 req/min per IP on pages and sign-in), failed sign-in lockout, security headers, Zod validation before writes, server-side provider isolation, 401s from API routes without a session |
| 10  | Responsive UI & Landing Page | Complete | Glassmorphism design over an animated molten background (still frame for reduced motion, static fallback without WebGL2), pricing/about/demo-account sections, sticky navigation, responsive layout |

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
- Time rules: confirm only before the start; check in from an hour before until the visit ends; complete and mark no-shows only after the start; a confirmed appointment can't be cancelled once it has started; no rescheduling after check-in
- A status change only applies if nobody else changed the appointment in the meantime
- Visit notes only once the patient has checked in
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
- Appointments by provider: horizontal bars with values at the bar ends (front desk only)
- Appointments by status: donut with a counted legend; hovering a slice or row shows that status in the centre
- No-show rate over the last 8 weeks: area chart on Monday–Sunday weeks, with the change on the previous week
- Stat tiles for today's appointments, check-ins, upcoming visits and this week's no-shows, counted from the database on the same Monday–Sunday weeks
- Status colours checked with a colour-blindness validator; every chart has a screen-reader table

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
- Glassmorphism design over an animated WebGL molten background shared by every page
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
│   └── layout/            # Navigation, glass and animated backgrounds
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
│   ├── unit/              # Unit tests (117 passing)
│   └── integration/       # Integration tests (62 passing)
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

- **Unit Tests**: 117/117 passing (100%)
  - Validation schemas (13 tests)
  - Appointment service business logic, including timing rules and concurrent changes (31 tests)
  - Authorization helpers (13 tests)
  - Clinic-time conversions (9 tests)
  - Analytics provider isolation (12 tests)
  - Appointment details view: visit-note permission, history loading, provider isolation (11 tests)
  - Appointment timing rules shared by the service and the UI (8 tests)
  - API route and cron authentication (11 tests)
  - Alerts and hardening: de-duplication, alert ownership, provider accounts without a linked provider, sign-in lockout (9 tests)

- **Integration Tests**: 62/62 passing (100%)
  - Security and unauthorized access (15 tests)
  - Appointment state machine and timing rules (19 tests)
  - Authorization and access control (12 tests)
  - Duplicate booking prevention (10 tests)
  - Appointment workflow (6 tests)

**Total: 179/179 tests passing**

Unit tests mock the database. Integration tests run against a local PostgreSQL test database (`clinicos_test`) with mocked authentication, never against Supabase.

## Build & Deployment Status

- **Build**: Passes successfully (`npm run build`)
- **Type checking**: No TypeScript errors (`npx tsc --noEmit`)
- **Linting**: ESLint passes (`npm run lint`)
- **Tests**: All 179 tests passing (`npm test`)
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
- State machine prevents invalid transitions, and time rules stop check-ins, completions, no-shows and cancellations at the wrong moment
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
6. **Pagination**: Offset-based, newest first by date and time, with no column sorting; may have performance issues with large datasets (>1000 records)
7. **Search**: Patient name, email or phone; no full-text search capabilities
8. **File Upload**: Not implemented for visit notes attachments
9. **Multi-Clinic**: Single clinic deployment only
10. **Audit Log Retention**: No automated retention policy or archival system
11. **Backup/Recovery**: No automated backup system included
12. **Alert Linking**: Alerts reference appointments through an ID in the message text, not a foreign key
13. **Single Timezone**: One clinic timezone per deployment
14. **Alert Cadence**: The Vercel cron runs once a day (Hobby plan limit), so the 1-hour urgent alert only fires if the job runs inside that window
15. **Error Tracking**: Sentry config files are included, but Sentry isn't initialised
16. **Animated Background**: The molten WebGL background runs on every page and redraws continuously, so low-end devices may notice battery use or less smooth scrolling on the dashboard. Reduced-motion users get a still frame, and without WebGL2 the static glass background shows instead

## Time Spent

**Total**: Approximately 20-26 hours

Breakdown (matches the sessions in [docs/plan.md](./docs/plan.md)):
- Foundation, setup and landing page: 1.5 hours
- Database and authentication: 2.5 hours
- Appointments (state machine, conflict detection): 3 hours
- Scheduling and availability: 2.5 hours
- Visit notes: 2 hours
- Alerts: 1.5 hours
- Analytics dashboard: 2 hours
- Testing: 3 hours
- Security and audit logging: 2.5 hours
- Polish and documentation: 1.5 hours
- UI consistency pass, data-integrity audit and final review: 4 hours

## What Would You Do Next, With Another 12 Hours?

The priorities come from the gaps the final review found (see Known Limitations), ordered by risk to a real clinic rather than by visual polish.

### Priority 1: Close the remaining security gaps (3 hours)
- Initialise Sentry (the config files exist but aren't wired in) with PHI scrubbing, and stop logging raw error objects that can contain patient details
- Add a Content-Security-Policy header
- Move rate limiting to Redis (Upstash) so it's shared across instances, and extend it to every API route
- Session inactivity timeout (15 minutes) and password complexity rules for new provider accounts

### Priority 2: End-to-end tests and CI (3 hours)
- Playwright tests for the core flow: sign in, book, get refused a double-booking, confirm, check in, write a visit note, check the History tab
- Component tests for the appointment dialogs; the cancel and no-show dialogs acting on a previously opened appointment was a bug no unit test could catch
- GitHub Actions running lint, typecheck, unit tests and integration tests against a Postgres service, on every push

### Priority 3: Scheduling correctness (3 hours)
- A reschedule dialog (the service and rules exist; there's no UI for it yet)
- An appointments list that shows upcoming visits first, with sortable date and status columns
- A real foreign key from Alert to Appointment instead of an ID embedded in the message text

### Priority 4: Reminders that reach patients and staff (2 hours)
- Transactional email (Resend) for 24-hour and 1-hour reminders; alerts are in-app only today
- Run alert generation hourly (a Vercel paid-plan cron or an external scheduler), since the daily Hobby cron makes the 1-hour alert unreliable

### Priority 5: Audit log viewer (1 hour)
- A read-only front-desk page for the AuditLog table, filterable by user, record and date, so the audit trail can be inspected without Prisma Studio

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
| Appointments | The only time rule was for no-shows: a visit could be checked in days early or completed before it started; two simultaneous status changes could both apply; the cancel and no-show dialogs could act on a previously opened appointment | Shared timing rules enforced by the service and reflected in the actions menu; status-conditional updates; dialogs always act on the selected row |
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
- **Testing**: All 179 tests passing (117 unit + 62 integration). Integration tests need a local PostgreSQL `clinicos_test` database
- **Build**: Passes successfully, ready for Vercel deployment
- **Demo Data**: Seed creates 3 users, 2 providers, 5 patients, 5 appointments, 18 availability slots, 1 visit note and 3 alerts
- **Documentation**: See `/docs` for architecture, decisions, schema details and the development plan
- **Environment**: Set `CLINIC_TIMEZONE` (defaults to `Asia/Kolkata`) wherever the app runs, and `CRON_SECRET` on Vercel
- **Code Quality**: TypeScript strict mode, ESLint passing, Prettier formatting

**Project Positioning**: This is a demonstration of healthcare application architecture and security patterns. It shows HIPAA-oriented design considerations but is not a certified, production-ready system for handling real patient data. Suitable as a portfolio/learning project or starting point for a production application that would require additional security hardening, compliance validation, and operational infrastructure.
