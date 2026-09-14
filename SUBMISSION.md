# ClinicOS - Clinic Appointment & Management Platform

## Links

- **GitHub repository**: [github](https://github.com/mainak569/clinic-os)
- **Live application**: [vercel](https://clinic-os-352p.vercel.app/)

## Project Overview

ClinicOS is a clinic management platform built with Next.js 15, TypeScript, PostgreSQL, and Prisma. It enables clinics to manage appointments, provider availability, patient records, visit documentation, and operational analytics through secure, role-based workflows.

It's a demonstration project: the architecture and security patterns follow healthcare security principles, but the app has not undergone formal compliance validation and is not intended for real patient data. See [Scope & Future Work](#scope--future-work) for what a production deployment would still need.

**Engineering highlights** (details under [Architecture Highlights](#architecture-highlights)):

- Double-booking is prevented by a per-provider Postgres advisory lock around a duration-aware conflict check, verified with concurrent requests through the Supabase pooler
- Availability is stored as clinic wall-clock time, so schedules stay correct on a UTC server
- Provider isolation is enforced server-side in actions, queries and API routes, and covered by unit and integration tests
- 250 automated tests covering business logic, authorization, security boundaries, and database workflows

## Demo Credentials

Sign in on the [live application](https://clinic-os-352p.vercel.app/login), or on a local copy after running `npm run db:seed`, with:

| Role       | Email                   | Password      | Access Level          |
| ---------- | ----------------------- | ------------- | --------------------- |
| FRONT_DESK | frontdesk@clinicos.com  | FrontDesk123! | Full system access    |
| PROVIDER   | dr.smith@clinicos.com   | DrSmith123!   | Own appointments only |
| PROVIDER   | dr.johnson@clinicos.com | DrJohnson123! | Own appointments only |

## Tech Stack

| Layer            | Technology                                                                        | Why                                                                                       |
| ---------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Frontend**     | Next.js 15, React 18, TypeScript 5                                                | Server Components for performance, type safety, modern React patterns                     |
| **UI**           | Tailwind CSS, shadcn/ui, Radix UI, ogl                                            | Responsive design, accessible components, glassmorphism over an animated WebGL background |
| **Backend**      | Next.js App Router, Server Actions                                                | Type-safe API, simplified data mutations, edge-ready                                      |
| **Database**     | PostgreSQL (Supabase), Prisma ORM                                                 | Type-safe queries, managed hosting, connection pooling                                    |
| **Auth**         | NextAuth.js v5, bcrypt                                                            | Flexible auth system, secure password hashing, JWT sessions                               |
| **State**        | TanStack React Query, React Hook Form                                             | Query client configured app-wide, form validation                                         |
| **Validation**   | Zod                                                                               | Runtime type checking, schema validation                                                  |
| **Charts**       | Recharts                                                                          | Dashboard bars, donut and area charts, each with a screen-reader table                    |
| **AI Assistant** | Groq API (`openai/gpt-oss-120b`), role-scoped context, guardrails, react-markdown | Called only from a server route; the API key never reaches the browser                    |
| **Testing**      | Jest, ts-jest                                                                     | Unit and integration testing                                                              |
| **Hosting**      | Vercel-ready                                                                      | Zero-config deployment, daily cron job                                                    |

## Goal Checklist

| #   | Goal                                 | Status   | Notes                                                                                                                                                                                                                               |
| --- | ------------------------------------ | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | User Authentication & Authorization  | Complete | NextAuth.js v5 with JWT sessions, bcrypt hashing, role-based access (PROVIDER, FRONT_DESK), provider data isolation                                                                                                                 |
| 2   | Appointment Management System        | Complete | State machine (6 states), duration-aware conflict detection, per-provider locking against concurrent double-booking, cancellation/no-show/reschedule tracking, time rules for check-in, completion, no-shows and cancellation       |
| 3   | Provider Scheduling & Availability   | Complete | Recurring weekly slots stored as clinic wall-clock time, bulk creation, overlap detection, availability checking before booking, provider management (add/edit/deactivate, at most 5 active)                                        |
| 4   | Patient Record Management            | Complete | Demographics, medical history, emergency contacts, search by name/email/phone, soft delete with restore on re-registration                                                                                                          |
| 5   | Clinical Documentation (Visit Notes) | Complete | SOAP format, range-checked vital signs, clearable fields, immutable history, amendment system with user attribution                                                                                                                 |
| 6   | Alerts & Notifications System        | Complete | 24-hour and 1-hour automated alerts, daily Vercel cron (Hobby plan limit), deduplication logic, dismissal tracking                                                                                                                  |
| 7   | Analytics Dashboard                  | Complete | Appointments by provider (bars) and status (donut), 8-week no-show trend, live counts for today's appointments and check-ins; colour-blind-checked status colours and screen-reader tables                                          |
| 8   | Security-Focused Audit Logging       | Complete | Append-only audit trail for patient, appointment, visit note, and provider changes with user context (demonstration; not compliance-certified)                                                                                      |
| 9   | Security Implementation              | Complete | Rate limiting (100 req/min per IP on pages and sign-in), failed sign-in lockout, security headers, Zod validation before writes, server-side provider isolation, 401s from API routes without a session                             |
| 10  | Responsive UI & Landing Page         | Complete | Glassmorphism design over an animated molten background (still frame for reduced motion, static fallback without WebGL2), features, about, contact and demo-account sections, sticky navigation, responsive layout, custom 404 page |

**Overall Progress**: 10/10 goals completed

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

### Provider Scheduling

- Recurring availability slots (weekly patterns), stored as clinic wall-clock time so hours don't shift between browser and server timezones
- Bulk availability creation with overlap detection
- Slot archiving (soft delete) and schedule export

### Provider Management

- Front desk can add providers: login, provider record and profile created together in one transaction
- Edit name, title, email, password and scheduling defaults
- Deactivate (disables login and booking; refused while appointments are open) and reactivate
- At most 5 active providers; adding or reactivating one beyond that is refused
- "Show on login page" lists a provider's email and password on the sign-in page; the listing follows password changes and deactivation, and only front desk can change it

### Patient Management

- Demographics, medical history, emergency contacts, insurance details
- Search by name, email or phone
- Emails normalised so different casing counts as the same patient
- Soft delete; registering the same person again restores their archived record and history

### Clinical Documentation

- Visit notes in SOAP format (Subjective, Objective, Assessment, Plan)
- Vital signs with clinically plausible ranges that match the database column precision
- Immutable visit note history with amendment tracking and user attribution

### Alerts & Notifications

- Automated 24-hour alerts for unconfirmed (REQUESTED) appointments, and urgent alerts within the final hour
- De-duplication, so repeated runs don't create the same alert twice
- Cron job for alert generation (daily on Vercel Hobby, protected by `CRON_SECRET`)
- Alert dismissal and mark-as-read, limited to the provider who owns the alert

### Analytics Dashboard

- Appointments by provider (bars, front desk only) and by status (donut with a counted legend)
- No-show rate over the last 8 weeks, with the change from the previous week
- Stat tiles for today's appointments, check-ins, upcoming visits and this week's no-shows
- Status colours checked with a colour-blindness validator; every chart has a screen-reader table

### Audit Logging

- Security-focused audit trail (demonstration purposes) of patient record views and all changes to patients, appointments, visit notes and providers, with user, IP and user agent
- Append-only: the app never updates or deletes audit rows
- No retention automation or in-app viewer yet (inspect with Prisma Studio)

### Security Features

- Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (no Content-Security-Policy yet)
- Rate limiting: 100 requests/minute per IP on pages and sign-in (memory-based, per instance)
- Failed sign-in lockout: 5 failures lock an email for 15 minutes, with one generic error message
- Input validation with Zod before every database write; SQL injection prevented by Prisma's parameterized queries
- CSRF protection (NextAuth for sign-in, Next.js origin checks for Server Actions)
- API routes answer 401 without a session; the cron endpoint requires `CRON_SECRET` in production

### AI Assistant

- Floating chat on every dashboard page, for signed-in users only; the API route checks the session and role itself and rate-limits each user
- Before calling the model, the server adds a short summary of today's schedule scoped to the user's role: a provider sees only their own appointments, and patient names, contact details and notes are never included
- Answers questions about appointments, schedules and clinic workflows in short Markdown replies, streamed as they're written
- Guardrails answer off-topic, medical-advice and prompt-injection requests without calling the model
- The model has no tools and no database access, so it can't change records; `GROQ_API_KEY` stays on the server

### Responsive Landing Page

- Glassmorphism design over an animated WebGL molten background, shared by every page
- Fully responsive (mobile, tablet, desktop); features, about, contact and demo-account sections
- A custom 404 page and an access-denied page in the same design

## Project Structure

```
clinic-os/
├── app/
│   ├── actions/           # Server Actions (API layer)
│   ├── api/               # REST API routes (including the AI assistant)
│   ├── dashboard/         # Protected dashboard (appointments, patients, schedule, providers)
│   ├── login/             # Sign-in page (lists demo accounts)
│   ├── not-found.tsx      # Custom 404 page
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
│   ├── assistant/         # AI assistant chat widget
│   └── layout/            # Navigation, glass and animated backgrounds
├── lib/
│   ├── ai/                # Assistant guardrails, system prompt, role-scoped context, Groq client
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
├── scripts/                # Data migration and integrity-check tooling
├── __tests__/
│   ├── unit/               # Unit tests (188 passing)
│   └── integration/        # Integration tests (62 passing)
└── docs/                   # Architecture, decisions, schema
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

- **Unit Tests**: 188/188 passing — validation schemas, appointment service business logic (state machine, timing rules, concurrent changes), authorization helpers, clinic-time conversions, analytics provider isolation and summary counts, appointment-details view, API route and cron authentication, alert de-duplication and ownership, sign-in lockout, provider limit and login-page demo accounts, AI assistant (authentication, guardrails, role-scoped context, streaming, rate limiting, key handling)
- **Integration Tests**: 62/62 passing — security and unauthorized access, appointment state machine and timing rules, authorization and access control, duplicate booking prevention, appointment workflow

**Total: 250/250 tests passing.** Unit tests mock the database; integration tests run against a local PostgreSQL test database (`clinicos_test`) with mocked authentication, never against Supabase.

## Build & Deployment Status

- **Build**: Passes (`npm run build`) — **Type checking**: no errors (`npx tsc --noEmit`) — **Linting**: passes (`npm run lint`)
- **Tests**: 250/250 passing (`npm test`)
- **Deployment**: Vercel-ready; set `CLINIC_TIMEZONE`, `CRON_SECRET` and `GROQ_API_KEY` in the environment. `vercel.json` runs functions in Tokyo (`hnd1`), next to the Supabase database
- **Demo**: Live at [vercel](https://clinic-os-352p.vercel.app/)

## What's Working

**Complete workflows**: authentication → dashboard; appointment create → confirm → check-in → complete, with state validation at every step; provider scheduling and management; visit note documentation with history; the analytics dashboard; and audit logging across patient, appointment, visit note and provider changes.

**Authorization**: enforced server-side, not just hidden in the UI — every Server Action and API route checks the session itself, and providers are scoped to their own appointments and patients at the database query level.

**Data integrity**: no double-booking (duration-aware overlap check plus a per-provider database lock); the state machine and its timing rules block invalid or mistimed transitions; availability is checked on the clinic's wall clock, independent of server timezone; deleted patients can be re-registered without a unique-constraint error.

## A Real Consistency Audit, Not Just Feature Work

Sessions 1-10 built the feature set. Before calling it done, a dedicated audit session (Session 11 — see [docs/plan.md](./docs/plan.md)) compared the schema, validation, services, actions and forms end to end, and verified every fix against the running app and the real database rather than the type checker alone. It found and fixed nine real issues:

| Area         | Issue found                                                                                                        | Fix                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Availability | Slot times stored in two encodings and read in the server's timezone; an 8 AM–12 PM slot displayed as 1:30–5:30 PM | Canonical wall-clock encoding, a clinic-timezone setting, and a data migration for existing slots          |
| Appointments | A short visit could be booked inside a longer one; two simultaneous requests could both book the same slot         | Overlap check uses each visit's own duration; a per-provider advisory lock serializes the check-and-insert |
| Appointments | `POST /api/appointments` bypassed the service layer, skipping validation, availability and audit checks            | Routed through the same service the UI uses                                                                |
| Patients     | Re-registering a deleted patient failed on the unique email/phone index                                            | Archived record is restored with the new details instead                                                   |
| Providers    | No way to add or manage providers outside the seed script                                                          | Providers page, service, and validated API                                                                 |
| Visit notes  | No range limits on vitals, fields couldn't be cleared, Decimal values couldn't reach the browser                   | Bounds added, nullable updates supported, values serialized                                                |
| Analytics    | A provider's dashboard showed clinic-wide data instead of their own                                                | Every analytics query scoped to the signed-in provider; the cross-provider view is front-desk only         |
| Appointments | Only no-shows had a timing rule; a visit could be checked in days early or completed before it started             | Timing rules shared by the service and the UI, enforced on every transition                                |
| App-wide     | Validation errors surfaced as raw JSON; failed writes were retried automatically, including rejected ones          | Readable error messages; rejected writes are never retried                                                 |

This is the reason integration tests in this project run against a real PostgreSQL database rather than mocks — the two issues above with the most real-world impact (the booking race and the timezone bug) only reproduced under real concurrency and a real clock.

## Time Spent

**Total**: Approximately 15-18 hours, across 12 sessions. Full phase-by-phase breakdown, with the hardest part of each, is in [docs/plan.md](./docs/plan.md); in brief:

| Session(s) | Phase                                                                        | ~Hours |
| ---------- | ---------------------------------------------------------------------------- | ------ |
| 1-2        | Foundation (project setup, auth, route protection)                           | 2.5    |
| 3-5        | Core domain (appointment state machine, availability, visit notes)           | 4.5    |
| 6-7        | Value-add (alerts, analytics dashboard)                                      | 2      |
| 8-9        | Quality & security (test suite, audit logging, rate limiting)                | 3      |
| 10         | Documentation                                                                | 1      |
| 11         | Consistency audit (live-verified against the running app and database)       | 2      |
| 12         | AI Assistant (authenticated chatbot, role-scoped context, guardrails, tests) | 2      |

## Scope & Future Work

This is a prototype, scoped deliberately for a demonstration rather than a production deployment. Everything below is a known, intentional scope boundary — not an oversight — with the reasoning behind each:

1. **Not HIPAA certified** — the security patterns follow HIPAA principles, but the app hasn't undergone formal compliance validation. A real deployment would need that audit before handling PHI.
2. **Email/SMS notifications** — alerts are shown in the dashboard only; adding transactional email is the top item under [What Would You Do Next](#what-would-you-do-next-with-another-12-hours).
3. **Password complexity & session timeout** — 8-character minimum with bcrypt hashing, but no complexity rules or inactivity timeout (30-day session expiry only). Straightforward to add; deprioritized behind core functionality.
4. **Rate limiting is memory-based**, per server instance, and only covers pages and sign-in. Fine for a single-instance demo; a multi-instance deployment would need a shared store (Redis).
5. **Pagination is offset-based** with no column sorting, adequate below roughly 1,000 records; cursor-based pagination would be the next step at scale.
6. **Search is substring matching** on patient name, email and phone — no full-text search.
7. **Single clinic, single timezone per deployment** — multi-clinic support isn't implemented.
8. **Alerts reference their appointment by an embedded ID**, not a foreign key. Works correctly, but a real foreign key would be cleaner.
9. **Alert cadence**: the Vercel cron runs once daily (Hobby plan limit), so the 1-hour urgent alert only fires if the job happens to run inside that window. Documented as a known trade-off of the hosting tier.
10. **No audit log retention policy, backup automation beyond the hosting provider's, or file upload for visit notes.**
11. **Sentry is configured but not initialized** — the config files are present for when it's needed.
12. **The animated WebGL background** runs continuously on every page; it pauses when the tab is hidden, renders at reduced resolution, and shows a single still frame for reduced-motion preferences, but low-end devices may still notice the cost.
13. **AI assistant** — uses a third-party model (Groq), so it receives only role-scoped schedule data (no patient names or notes), has no tools or write access, and is limited by Groq's free tier (about 8,000 tokens per minute). Retrieval over approved clinic knowledge and read-only tools are future work (Priority 5).
14. **Login-page demo accounts** — an account front desk lists on the sign-in page keeps a readable copy of its password (`users.demo_password`) so the page can show it. Suitable for demo accounts only; every other password is stored only as a bcrypt hash.

## What Would You Do Next, With Another 12 Hours?

### Priority 1: Close the remaining security gaps (2 hours)

- Initialize Sentry with PHI scrubbing, and stop logging raw error objects that can contain patient details
- Add a Content-Security-Policy header
- Move rate limiting to Redis so it's shared across instances, and extend it to every API route

### Priority 2: End-to-end tests and CI (2 hours)

- Browser tests for the core flow: sign in, book, get refused a double-booking, confirm, check in, write a visit note
- CI running lint, typecheck, unit and integration tests on every push

### Priority 3: Scheduling and workflow improvements (2 hours)

- A reschedule dialog (the service and rules already exist; there's no UI for it yet)
- An appointments list with sortable date and status columns
- A real foreign key from Alert to Appointment instead of an embedded ID

### Priority 4: Reminders that reach patients and staff (3 hours)

- Transactional email for 24-hour and 1-hour reminders
- Hourly alert generation (a paid-tier cron or an external scheduler), since the daily Hobby cron limits the 1-hour alert's reliability

### Priority 5: Expand assistant knowledge retrieval (3 hours)

- Add vector-based retrieval (pgvector on the existing Supabase database) over approved clinic knowledge such as policies, workflows and documentation
- Add read-only backend tools for operational questions (for example a provider's availability), each going through the existing services and permission checks, so the model still never queries the database
- Log assistant questions to the audit trail, with the same authentication and role checks used throughout ClinicOS

## Honest Self-Assessment

The codebase is consistent and its core guarantees (no double-booking, provider isolation, an immutable audit trail) are verified rather than assumed, but a few decisions were made for speed over long-term structure and would need revisiting before this scaled past a demo:

- **In-memory rate limiting.** Works correctly for a single instance, but the limit and the sign-in lockout would need to move to a shared store (Redis) before running behind more than one server — noted above and in [docs/decisions.md](./docs/decisions.md).
- **Offset pagination.** Simple and correct at this data volume; would need cursor-based pagination before it stayed fast past roughly 1,000 records.
- **Services import Prisma directly.** Keeps the code straightforward to read, at the cost of unit tests needing to mock the whole client, and anything depending on real SQL (the advisory lock, overlap queries) needing the integration test database rather than a pure unit test.
- **No retry UI for network failures.** Server responses are readable and rejected writes are never retried automatically (retrying a rejection could only repeat it), but there's no retry button or offline detection yet — recovery after a dropped connection is a manual refresh.

## Architecture Highlights

### Service Layer Pattern

Business logic separated from the HTTP/action layer for testability and reusability — the same service backs both the UI's Server Actions and the REST API.

### State Machine for Appointments

Explicit states and transitions prevent invalid workflows (can't complete without check-in), with timing rules shared between the service that enforces them and the UI that offers only the allowed actions.

### Provider Isolation

Database-level filtering ensures providers can never access other providers' data, including patient search, which is filtered in the query so pagination and totals stay correct.

### Concurrency-Safe Booking

The conflict check and the insert run inside one transaction holding a per-provider Postgres advisory lock, so two simultaneous requests for the same slot can't both succeed. Verified through the Supabase connection pooler.

### Clinic Wall-Clock Time

Availability slots store wall-clock time on a fixed date; appointments are converted to the clinic's timezone before comparison, so the answer is the same on a laptop and on a UTC server.

### Fast Dashboard Loads

Functions run in the same region as the database, the dashboard's analytics and stats load through one Server Action (the browser runs Server Actions one at a time), and the analytics summary comes from one group-by instead of five counts. Measured from a development machine, dashboard data went from about 3.5 s to 0.9 s and alert checks from about 5 s to 0.8 s.

### Audit Trail

Patient record views and changes to patients, appointments, visit notes and providers are logged with user, timestamp, IP and user agent. This follows healthcare security audit practices but is not compliance-certified.

### Type Safety

End-to-end TypeScript with Zod runtime validation and Prisma-generated types.

## To Review

- **Development**: Copy `.env.example` to `.env` and fill it in, then run `npm install`, `npx prisma migrate deploy`, `npm run db:seed` and `npm run dev`
- **Testing**: 250 tests passing (188 unit + 62 integration). Integration tests need a local PostgreSQL `clinicos_test` database
- **Demo Data**: Seed creates 3 users, 2 providers, 5 patients, 5 appointments, 18 availability slots, 1 visit note and 3 alerts
- **Documentation**: See `/docs` for architecture, decisions, schema details and the development plan
- **Environment**: Set `CLINIC_TIMEZONE` (defaults to `Asia/Kolkata`) wherever the app runs, `CRON_SECRET` on Vercel, and `GROQ_API_KEY` for the AI assistant
