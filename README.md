# ClinicOS

A healthcare practice management prototype built with Next.js 15, TypeScript, and modern web technologies. Designed as a demonstration project with HIPAA-oriented security and auditability considerations for appointment scheduling, provider availability management, and clinical documentation.

**Note**: This is a student/prototype project for educational purposes. It demonstrates healthcare application architecture and security patterns but is not certified for production use with real patient data.

**Start here:** [SUBMISSION.md](./SUBMISSION.md) has a 5-minute walkthrough of the core flow. The code most worth reading is the per-provider booking lock and duration-aware conflict check (`lib/services/appointment.service.ts`), clinic wall-clock availability (`lib/clinic-time.ts`), and server-side provider isolation with its tests (`__tests__/`).

## Features

### Core Functionality

- **Appointment Management**: Create, confirm, check-in, complete, cancel, mark no-show, and reschedule appointments with state machine validation
- **Double-Booking Protection**: Overlap detection that accounts for each visit's real duration, serialized per provider so simultaneous requests can't both book the same slot
- **Provider Scheduling**: Recurring weekly availability slots with overlap detection and bulk creation
- **Provider Management**: Front desk can add providers (login, profile and scheduling defaults in one step), edit them, and deactivate or reactivate them
- **Patient Records**: Demographics, medical history, insurance and emergency contacts; deleted records are archived and restored if the same person is registered again
- **Visit Notes**: SOAP documentation with range-checked vital signs and an immutable edit history
- **Alerts**: Automated reminders for unconfirmed appointments (24-hour and 1-hour)
- **Analytics**: Appointments by status and weekly no-show rates, scoped to the signed-in provider; front desk also sees appointments by provider
- **Audit Logging**: HIPAA-oriented audit trail of patient record views and of changes to patients, appointments, visit notes and providers (demonstration purposes)

### Security & Authorization

- **Authentication**: NextAuth.js v5 with JWT sessions and bcrypt password hashing
- **Role-Based Access**: Provider and Front Desk roles with different permissions
- **Provider Isolation**: Providers can only access their own appointments and patients
- **Security Headers**: HSTS, clickjacking and MIME-sniffing protection, strict referrer policy
- **Rate Limiting**: 100 requests/minute per IP on pages and sign-in, and 5 failed sign-ins lock an email for 15 minutes (memory-based)

## Tech Stack

- **Framework**: Next.js 15.5 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL via Supabase with Prisma ORM 5.22
- **Authentication**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui (Radix UI components)
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack React Query 5
- **Charts**: Recharts 3
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
   AUTH_URL="http://localhost:3000"

   # Timezone the clinic's opening hours are expressed in (IANA name).
   # Defaults to Asia/Kolkata. Set this explicitly on any server that runs in UTC.
   CLINIC_TIMEZONE="Asia/Kolkata"
   ```

   > **Deploying to Vercel?** Set `CLINIC_TIMEZONE` and `CRON_SECRET` in the project's environment variables. Availability is compared on the clinic's wall clock, so a missing or wrong timezone makes every slot appear shifted, and the alert cron refuses every request without the secret.

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

   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Credentials

After seeding the database, log in with:

| Role       | Email                     | Password        |
| ---------- | ------------------------- | --------------- |
| Front Desk | `frontdesk@clinicos.com`  | `FrontDesk123!` |
| Provider   | `dr.smith@clinicos.com`   | `DrSmith123!`   |
| Provider   | `dr.johnson@clinicos.com` | `DrJohnson123!` |

The seed creates 3 users, 2 providers (with profiles), 18 availability slots, 5 patients, 5 appointments, 1 visit note and 3 alerts.

## Project Structure

```
app/
  actions/              # Server Actions (authorization + validation entry points)
  api/                  # API Routes (appointments, patients, providers, cron)
  dashboard/
    layout.tsx          # Shared header and navigation for all dashboard routes
    appointments/       # Appointment management
    patients/           # Patient records
    schedule/           # Provider availability
    providers/          # Provider management (Front Desk only)
  login/                # Authentication page

components/
  ui/                   # shadcn/ui components
  appointments/         # Appointment dialogs, tables, visit notes
  availability/         # Bulk availability and schedule export
  schedule/             # Week / month / list schedule views
  patients/             # Patient table and dialogs
  provider-management/  # Providers table and form
  dashboard/            # Dashboard widgets and charts
  layout/               # Header, navigation, shared background

lib/
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
  validations/          # Zod schemas (shared by forms and server actions)
  clinic-time.ts        # Wall-clock time helpers for availability
  appointment-status.ts # Single source of appointment status labels and colours
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
  unit/                 # Unit tests (102)
  integration/          # Integration tests (55)
```

## Development Commands

```bash
# Development
npm run dev              # Start development server
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

The project includes **157 passing tests**:

- **Unit Tests (102)**: Validation schemas, appointment service rules (state machine, double-booking, archived patients, past bookings, per-provider locking), authorization helpers, clinic-time conversions, analytics provider isolation, the appointment details view (visit-note permission, history loading, provider isolation), API routes answering 401 without a session, alert de-duplication and ownership, the cron secret, and the failed sign-in lockout
- **Integration Tests (55)**: State machine transitions, authorization boundaries, security controls, duplicate and concurrent booking prevention, end-to-end appointment workflows

Run with `npm test`.

**Integration tests need a local PostgreSQL database.** `__tests__/setup.ts` points them at `postgresql://test_user:test_password@localhost:5432/clinicos_test`, so they never touch your Supabase database. They create and delete their own records. The test clinic timezone is set to the machine's own timezone, so the suite passes on a local machine and on a UTC CI runner.

## Availability and Time Zones

Availability slots are recurring wall-clock times ("Mondays 09:00–12:00"), not moments in time. They are stored on a fixed date (`1970-01-01`) in the UTC fields, so `09:00` is always `1970-01-01T09:00:00Z`, whatever timezone the browser or server runs in. Appointments stay real timestamps and are converted to the clinic's wall clock (`CLINIC_TIMEZONE`) before being checked against slots.

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

This is a prototype/demonstration project with the following limitations:

1. **Not HIPAA Certified**: While security patterns follow HIPAA principles, this has not undergone formal compliance validation
2. **Rate Limiting**: Memory-based and per server instance, so it resets on restart and isn't shared between instances (production would need Redis). API routes other than sign-in aren't rate limited
3. **Email Notifications**: Not implemented. Alerts are shown in the dashboard only
4. **Password Requirements**: Minimum 8 characters for new provider accounts (no complexity rules), though all passwords are bcrypt-hashed
5. **Session Management**: No inactivity timeout. Sessions last 30 days, and a provider's name change appears after they sign in again
6. **Pagination**: Offset-based. May have performance issues with large datasets (>1000 records)
7. **Search**: Patients by name, email or phone. No full-text search
8. **Alert Linking**: Alerts reference their appointment through an ID embedded in the message text rather than a database foreign key
9. **Single Timezone**: One clinic timezone per deployment. Dashboard "today" counts use the server's day boundaries (UTC on Vercel)
10. **Alert Cadence**: The Vercel cron in `vercel.json` runs once a day (Hobby plan limit), so the 1-hour urgent alert only fires if the job happens to run inside that window
11. **Audit Log Retention**: No automated retention policy or archival system
12. **Multi-Tenancy**: Designed for single clinic use. Multi-clinic support not implemented
13. **Backup/Recovery**: No automated backup system included beyond the hosting provider's
14. **File Upload**: Not implemented for visit note attachments
15. **Error Tracking**: Sentry config files are included, but Sentry isn't initialised

## Security Considerations

This prototype implements several security best practices:

- Passwords hashed with bcrypt (cost factor 10)
- JWT sessions with HTTP-only cookies
- Role-based access control with provider isolation
- Security headers configured (HSTS, clickjacking and MIME-sniffing protection)
- Rate limiting and a failed sign-in lockout (memory-based)
- Sign-in failures all return one generic message, so responses don't reveal which accounts exist
- Audit logging for patient record views and data changes
- Error messages sanitized to avoid information leakage; validation failures return a single readable message

**Important**: This is a demonstration project. For production use with real patient data, additional requirements include:

1. **Compliance Certification**: HIPAA compliance audit and certification
2. **Security Hardening**:
   - Password complexity requirements and rotation policies
   - Session timeout on inactivity (15-30 minutes)
   - Multi-factor authentication (MFA)
   - Redis-based rate limiting for distributed systems
3. **Audit & Monitoring**:
   - 7-year audit log retention policy
   - Real-time security monitoring and alerting
   - Regular security assessments and penetration testing
4. **Data Protection**:
   - Encryption at rest for PHI data
   - Backup and disaster recovery procedures
   - Data breach response plan
5. **Access Controls**:
   - Regular access reviews
   - Principle of least privilege enforcement
   - Secure credential management (secrets manager)

## License

No license is granted. This is a prototype submitted for evaluation, not for reuse or production use.

## Contributing

1. Follow TypeScript strict mode requirements
2. Use Prettier for code formatting (`npm run format`)
3. Ensure ESLint passes (`npm run lint`)
4. Write tests for new features
5. Update documentation
6. Test on mobile, tablet, and desktop

For architecture conventions, see [docs/architecture.md](./docs/architecture.md).
