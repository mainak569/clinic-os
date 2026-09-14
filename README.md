<div align="center">

<img src="public/favicon.svg" alt="ClinicOS logo" width="120" />

# ClinicOS

**Clinic Appointment & Practice Management Platform**

Manage appointments, provider availability, patient records, visit notes and analytics through a secure, role-based workflow.

<a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-15.5-black?logo=next.js&logoColor=white" alt="Next.js 15.5" /></a>
<a href="https://react.dev"><img src="https://img.shields.io/badge/React-18.3-3178C6?logo=react&logoColor=61DAFB" alt="React 18.3" /></a>
<a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.9" /></a>
<a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_CSS-v3-38BDF8?logo=tailwindcss&logoColor=white" alt="Tailwind CSS v3" /></a>
<a href="https://www.prisma.io"><img src="https://img.shields.io/badge/Prisma-5.22-2D3748?logo=prisma&logoColor=white" alt="Prisma 5.22" /></a>
<a href="https://www.postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL via Supabase" /></a>
<br />
<a href="https://authjs.dev"><img src="https://img.shields.io/badge/NextAuth.js-v5-7C3AED?logo=auth0&logoColor=white" alt="NextAuth.js v5" /></a>
<a href="https://tanstack.com/query"><img src="https://img.shields.io/badge/TanStack_Query-v5-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query v5" /></a>
<a href="https://zod.dev"><img src="https://img.shields.io/badge/Zod-v4-3E67B1?logo=zod&logoColor=white" alt="Zod v4" /></a>
<a href="https://groq.com"><img src="https://img.shields.io/badge/Groq-AI_Assistant-F55036" alt="Groq AI Assistant" /></a>
<a href="https://jestjs.io"><img src="https://img.shields.io/badge/Jest-Tested-C21325?logo=jest&logoColor=white" alt="Jest" /></a>

<p>
  <a href="https://clinic-os-352p.vercel.app/"><strong>Live Demo</strong></a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#getting-started">Getting Started</a> ·
  <a href="#project-structure">Project Structure</a> ·
  <a href="#testing">Testing</a> ·
  <a href="#security-considerations">Security</a>
</p>

</div>

---

> **Note:** This project is a software engineering demonstration built to showcase healthcare application architecture, security practices, and scalable full-stack development patterns.

## Features

### Core Functionality

- **Appointment Management**: Create, confirm, check-in, complete, cancel, mark no-show, and reschedule appointments, with state machine validation and time rules (confirm only before the start; check in from an hour before until the visit ends; complete and mark no-shows only after the start; a confirmed appointment can't be cancelled once it has started; no rescheduling after check-in)
- **Double-Booking Protection**: Overlap detection that accounts for each visit's real duration, serialized per provider so simultaneous requests can't both book the same slot
- **Provider Scheduling**: Recurring weekly availability slots with overlap detection and bulk creation
- **Provider Management**: Front desk can add providers (login, profile and scheduling defaults in one step), edit them, and deactivate or reactivate them, with at most 5 active providers at a time. Providers marked "Show on login page" are listed with their password on the sign-in page, and the list follows password changes and deactivation
- **Patient Records**: Demographics, medical history, insurance and emergency contacts; deleted records are archived and restored if the same person is registered again
- **Visit Notes**: SOAP documentation with range-checked vital signs and an immutable edit history
- **Alerts**: Automated reminders for unconfirmed appointments (24-hour and 1-hour)
- **Analytics**: Stat tiles, appointments by status (donut) and an 8-week no-show trend, scoped to the signed-in provider; front desk also sees appointments by provider. Status colours are checked for colour-blind separation and every chart has a screen-reader table
- **Audit Logging**: Tracks important user actions and data changes for accountability and traceability.
- **AI Assistant**: A floating dashboard chatbot for signed-in staff that answers questions about appointments, schedules and clinic workflows in short Markdown replies. Before each reply the server adds a summary of today's schedule scoped to the user's role (no patient names or notes). Off-topic and medical-advice requests are refused, and the model has no tools or database access, so it can't change records
- **Error Pages**: A custom 404 page and an access-denied page in the same design

### Security & Authorization

- **Authentication**: NextAuth.js v5 with JWT sessions and bcrypt password hashing
- **Role-Based Access**: Provider and Front Desk roles with different permissions
- **Provider Isolation**: Providers can only access their own appointments and patients
- **Security Headers**: HSTS, clickjacking and MIME-sniffing protection, strict referrer policy
- **Rate Limiting & Protection**: Request throttling and failed sign-in protection to reduce abuse.

## Tech Stack

- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL via Supabase with Prisma ORM 5.22
- **Authentication**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui (Radix UI components), with an animated WebGL background (ogl)
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack React Query 5
- **Charts**: Recharts 3
- **AI**: Groq API (`openai/gpt-oss-120b`), called only from a server route, with role-scoped context, guardrails and react-markdown rendering
- **Testing**: Jest + ts-jest

## Getting Started

### Prerequisites

- Node.js 18.18+ (required by Next.js 15)
- Supabase account (or local PostgreSQL)
- For integration tests: a local PostgreSQL database (see [Testing](#testing))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/mainak569/clinic-os.git
   cd clinic-os
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your values. Use `.env`, not `.env.local`: Prisma's CLI and the seed script only read `.env`.

   ```env
   # Supabase connection strings
   DATABASE_URL="postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://...@...pooler.supabase.com:5432/postgres"

   # Generate with: openssl rand -base64 32
   AUTH_SECRET="your-secret-key"
   # The app's own URL: http://localhost:3000 locally, https://clinic-os-352p.vercel.app in production
   AUTH_URL="http://localhost:3000"

   # Timezone the clinic's opening hours are expressed in (IANA name).
   # Defaults to Asia/Kolkata. Set this explicitly on any server that runs in UTC.
   CLINIC_TIMEZONE="Asia/Kolkata"

   # Optional: Groq API key for the dashboard AI assistant (server-side only)
   GROQ_API_KEY="gsk_..."
   ```

   > **Slow queries locally?** Far from the database, each query through the transaction pooler (`:6543`) takes several network round trips. Pointing your local `DATABASE_URL` at the session pooler (`:5432`, with `?connection_limit=5`) made queries about 5× faster in testing. Keep the transaction pooler on Vercel.

   > **Deploying to Vercel?** Set `CLINIC_TIMEZONE`, `CRON_SECRET` and `GROQ_API_KEY` in the project's environment variables. Availability is compared on the clinic's wall clock, so a missing or wrong timezone makes every slot appear shifted, the alert cron refuses every request without the secret, and without `GROQ_API_KEY` the assistant reports that it isn't configured. Functions run in Tokyo (`hnd1`, set in `vercel.json`), the same region as the Supabase database; change it if your database is elsewhere.

4. **Set up database**

   ```bash
   # Apply migrations (npm install has already generated the Prisma client)
   npx prisma migrate deploy

   # Seed database with demo data
   npm run db:seed
   ```

5. **Start development server**

   ```bash
   npm run dev
   ```

6. **Open application**

   Navigate to [http://localhost:3000](http://localhost:3000) for your local copy. The deployed app is at [https://clinic-os-352p.vercel.app](https://clinic-os-352p.vercel.app/).

### Demo Credentials

Use these on the [live demo](https://clinic-os-352p.vercel.app/login), or on a local copy after seeding the database:

| Role       | Email                     | Password        |
| ---------- | ------------------------- | --------------- |
| Front Desk | `frontdesk@clinicos.com`  | `FrontDesk123!` |
| Provider   | `dr.smith@clinicos.com`   | `DrSmith123!`   |
| Provider   | `dr.johnson@clinicos.com` | `DrJohnson123!` |

The seed creates 3 users, 2 providers (with profiles), 18 availability slots, 5 patients, 5 appointments, 1 visit note and 3 alerts.

The sign-in page lists these accounts, plus any provider front desk marks "Show on login page". A listed account's password is stored in readable form (`users.demo_password`) so it can be shown there, so only mark demo accounts.

## Project Structure

```
app/
  actions/              # Server Actions (authorization + validation entry points)
  api/                  # API Routes (appointments, patients, providers, assistant, cron)
  dashboard/
    layout.tsx          # Shared header and navigation for all dashboard routes
    appointments/       # Appointment management
    patients/           # Patient records
    schedule/           # Provider availability
    providers/          # Provider management (Front Desk only)
  login/                # Sign-in page (lists demo accounts)
  unauthorized/         # Access-denied page
  not-found.tsx         # Custom 404 page

components/
  ui/                   # shadcn/ui components
  appointments/         # Appointment dialogs, tables, visit notes
  availability/         # Bulk availability and schedule export
  schedule/             # Week / month / list schedule views
  patients/             # Patient table and dialogs
  provider-management/  # Providers table and form
  dashboard/            # Dashboard widgets and charts
  layout/               # Header, navigation, glass and animated molten backgrounds
  assistant/            # Floating AI assistant chat widget
  auth/                 # Login form
  landing/              # Landing page sections
  providers/            # Session and React Query providers

lib/
  ai/                   # Assistant: guardrails, system prompt, role-scoped context, Groq client
  services/             # Business logic layer
    appointment.service.ts
    availability.service.ts
    bulk-availability.service.ts
    patient.service.ts
    provider.service.ts
    visit-note.service.ts
    alert.service.ts
    analytics.service.ts
    audit.service.ts
    demo-accounts.service.ts  # Accounts listed on the login page
  validations/          # Zod schemas (shared by forms and server actions)
  clinic-time.ts        # Wall-clock time helpers for availability
  appointment-status.ts # Single source of appointment status labels and colours
  appointment-rules.ts  # When each appointment action is allowed (status and clock)
  serialize.ts          # Converts Prisma Decimals before data reaches the client
  action-error.ts       # Readable error messages for server actions
  revalidate.ts         # Cache revalidation for dashboard routes
  auth-helpers.ts       # Authorization utilities
  prisma.ts             # Prisma client

prisma/
  schema.prisma         # Database schema (11 models)
  migrations/           # Database migrations
  seed.ts               # Seed data

scripts/
  migrate-slot-times.ts # One-off data migration for availability slot times

__tests__/
  unit/                 # Unit tests (188)
  integration/          # Integration tests (62)
```

## Development Commands

```bash
# Development
npm run dev              # Start development server (Turbopack)
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes (dev)
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors
npm run format           # Format code with Prettier
npm run type-check       # TypeScript type check
```

## Testing

The project includes **250 passing tests**:

- **Unit Tests (188)**: Validation schemas, appointment service rules (state machine, double-booking, archived patients, past bookings, per-provider locking), authorization helpers, clinic-time conversions, analytics provider isolation and summary counts, the appointment details view (visit-note permission, history loading, provider isolation), API routes answering 401 without a session, alert de-duplication and ownership, the cron secret, the failed sign-in lockout, appointment timing rules, the provider limit and login-page demo accounts, and the AI assistant (authentication, guardrails, role-scoped context with no patient data, streaming, rate limiting, key handling)
- **Integration Tests (62)**: State machine transitions and timing rules, authorization boundaries, security controls, duplicate and concurrent booking prevention, end-to-end appointment workflows

Run with `npm test`.

**Integration tests need a local PostgreSQL database.** `__tests__/setup.ts` points them at `postgresql://test_user:test_password@localhost:5432/clinicos_test`, so they never touch your Supabase database. They create and delete their own records. The test clinic timezone is set to the machine's own timezone, so the suite passes on a local machine and on a UTC CI runner.

Existing databases created before this change can be converted with:

```bash
npx tsx scripts/migrate-slot-times.ts           # dry run: prints the plan
npx tsx scripts/migrate-slot-times.ts --apply   # applies it in one transaction
```

The script is safe to re-run and refuses to write if a conversion would produce an invalid or duplicate slot. See [docs/schema.md](./docs/schema.md#5-availabilityslot) for details.

## Documentation

- [Architecture](./docs/architecture.md) - System architecture and design patterns
- [Schema](./docs/schema.md) - Database schema and relationships
- [Decisions](./docs/decisions.md) - Key technical decisions and trade-offs
- [Plan](./docs/plan.md) - Development timeline and lessons learned
- [AI Prompts](./docs/ai-prompts.md) - AI assistance used during development

## Known Limitations

This project focuses on core clinic workflow management and demonstrates production-style engineering practices.

Future improvements could include:

- Distributed rate limiting with Redis
- External notification integrations (email/SMS)
- Advanced search and reporting
- Multi-clinic tenancy support
- Additional operational monitoring

## Security Considerations

ClinicOS implements:

- Password hashing using bcrypt
- Secure session-based authentication
- Role-based authorization
- Provider-level data isolation
- Server-side validation
- Security headers
- Audit logging
- Sanitized error handling

The project follows secure software engineering practices and demonstrates patterns commonly used in production applications.

## License

This project was created as part of a software engineering evaluation and portfolio demonstration.

## Contributing

1. Follow TypeScript strict mode requirements
2. Use Prettier for code formatting (`npm run format`)
3. Ensure ESLint passes (`npm run lint`)
4. Write tests for new features
5. Update documentation
6. Test on mobile, tablet, and desktop

For architecture conventions, see [docs/architecture.md](./docs/architecture.md).
