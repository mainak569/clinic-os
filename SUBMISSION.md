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
| 2   | Appointment Management System | Complete | Full CRUD with state machine (6 states), conflict detection, duplicate prevention, cancellation/no-show tracking |
| 3   | Provider Scheduling & Availability | Complete | Recurring weekly slots, bulk creation tool, overlap detection, availability checking before booking |
| 4   | Patient Record Management | Complete | Demographics, medical history, emergency contacts, search functionality, appointment linking |
| 5   | Clinical Documentation (Visit Notes) | Complete | SOAP format, vital signs tracking, immutable history, amendment system with user attribution |
| 6   | Alerts & Notifications System | Complete | 24-hour and 1-hour automated alerts, cron job (every 15min), deduplication logic, dismissal tracking |
| 7   | Analytics Dashboard | Complete | Charts for appointments by provider/status, no-show rates, date range filtering, real-time React Query updates |
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
- Conflict detection and duplicate booking prevention
- Back-to-back appointment support

### Provider Scheduling
- Recurring availability slots (weekly patterns)
- Manual slot creation and management
- Bulk availability creation tool
- Slot overlap detection
- Availability conflict checking
- Slot archiving (soft delete)
- Schedule export functionality

### Patient Management
- Patient demographics (name, DOB, contact)
- Medical history tracking
- Emergency contact information
- Patient search by name
- Patient record linking to appointments

### Clinical Documentation
- Visit notes with SOAP format (Subjective, Objective, Assessment, Plan)
- Vital signs tracking (BP, HR, temp, weight, height)
- Chief complaint documentation
- Diagnosis and treatment plan recording
- Immutable visit note history
- Amendment tracking with user attribution

### Alerts & Notifications
- Automated 24-hour alerts for requested appointments
- 1-hour urgent alerts before appointments
- Alert deduplication logic
- Cron job for alert generation (every 15 minutes)
- Alert dismissal and acknowledgment

### Analytics Dashboard
- Appointments by provider (bar chart)
- Appointments by status (pie chart)
- No-show rate tracking
- Date range filtering
- Real-time data with React Query

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
│   ├── dashboard/         # Protected dashboard
│   ├── login/             # Auth pages
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── appointments/      # Appointment components
│   ├── availability/      # Scheduling components
│   ├── dashboard/         # Analytics widgets
│   ├── landing/           # Landing page sections
│   └── layout/            # Navigation, footer
├── lib/
│   ├── services/          # Business logic layer
│   ├── validations/       # Zod schemas
│   ├── errors/            # Custom error classes
│   ├── auth-helpers.ts    # Authorization utilities
│   └── prisma.ts          # Database client
├── prisma/
│   ├── schema.prisma      # Database schema (9 models)
│   ├── migrations/        # Migration history
│   └── seed.ts            # Demo data seeding
├── __tests__/
│   ├── unit/              # Unit tests (29 passing)
│   └── integration/       # Integration tests (43 need fixing)
└── docs/                  # Architecture, decisions, schema
```

## Database Schema

9 core models with proper relationships:

1. **User** - Authentication and authorization
2. **Provider** - Healthcare provider profiles
3. **Patient** - Patient records
4. **Appointment** - Appointment scheduling
5. **AvailabilitySlot** - Provider availability
6. **VisitNote** - Clinical documentation
7. **Alert** - System notifications
8. **AuditLog** - Compliance logging
9. **VisitNoteHistory** - Immutable note history

## Testing Status

- **Unit Tests**: 44/44 passing (100%)
  - Validation schemas (13 tests)
  - Appointment service business logic (18 tests)
  - Authorization helpers (13 tests)
  
- **Integration Tests**: 55/55 passing (100%)
  - Security and unauthorized access (15 tests)
  - Appointment state machine (12 tests)
  - Authorization and access control (12 tests)
  - Duplicate booking prevention (10 tests)
  - Appointment workflow (6 tests)

**Total: 99/99 tests passing**

All tests use mocked authentication and isolated database transactions.

## Build & Deployment Status

- **Build**: Passes successfully (`npm run build`)
- **Type checking**: No TypeScript errors (`npx tsc --noEmit`)
- **Linting**: ESLint passes (`npm run lint`)
- **Tests**: All 99 tests passing (`npm test`)
- **Deployment**: Vercel-ready with environment variable template
- **Demo**: Live at [vercel](https://clinic-os-352p.vercel.app/)

**Note**: This is a demonstration deployment. Not for production use with real patient data.

## What's Working

### Complete Workflows
1. User Authentication: Login → Session → Dashboard → Logout
2. Appointment Lifecycle: Create → Confirm → Check-in → Complete (with state validation)
3. Provider Scheduling: Create slots → Check availability → Book appointments
4. Clinical Documentation: Create visit notes → View history → Track amendments
5. Analytics: Real-time dashboard with filterable charts
6. Audit Trail: All actions logged with full context

### Authorization
- Providers can only see their own appointments and patients
- Front desk can manage all appointments across all providers
- Backend authorization enforced (not just UI hiding)
- Middleware protects all routes

### Data Integrity
- No double-booking same time slot
- State machine prevents invalid transitions
- Availability checking before booking
- Conflict detection for overlapping appointments
- Audit logging captures all changes

## Known Limitations

This is a prototype/demonstration project with the following limitations:

1. **Not HIPAA Certified**: Security patterns follow HIPAA principles, but no formal compliance validation
2. **Email Notifications**: Not implemented (alerts shown in UI only)
3. **Password Complexity**: Basic validation only (no complexity enforcement, though bcrypt hashing works)
4. **Session Timeout**: No inactivity timeout (30-day expiry only)
5. **Rate Limiting**: Memory-based (single server, not Redis-backed for distributed systems)
6. **Pagination**: Basic implementation, may have performance issues with large datasets (>1000 records)
7. **Search**: Patient name only, no full-text search capabilities
8. **File Upload**: Not implemented for visit notes attachments
9. **Multi-Clinic**: Single clinic deployment only
10. **Audit Log Retention**: No automated retention policy or archival system
11. **Backup/Recovery**: No automated backup system included

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
**Why**: Error boundaries exist but error messages are generic. No retry logic for failed requests.

**Impact**: Poor user experience when things go wrong. Users don't know how to recover.

**Fix**: Better error messages, retry buttons, offline detection, clearer recovery paths.

---

### 5. No Email Notifications
**Why**: Alerts are only shown in the UI dashboard. No actual email or SMS notifications sent.

**Impact**: Users must log in to see appointment reminders. Defeats the purpose of automated alerts.

**Fix**: Integrate email service (Resend/SendGrid) with transactional email templates.

## Time Spent

**Total**: Approximately 36-40 hours

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

## Architecture Highlights

### Service Layer Pattern
Business logic separated from HTTP/action layer for testability and reusability.

### State Machine for Appointments
Explicit states and transitions prevent invalid workflows (can't complete without check-in).

### Provider Isolation
Database-level filtering ensures providers can never access other providers' data.

### Audit Trail
Every PHI access logged with user, timestamp, IP, and action for HIPAA compliance.

### Type Safety
End-to-end TypeScript with Zod runtime validation and Prisma generated types.

## Notes for Reviewer

- **Development**: Run `npm install`, `npx prisma generate`, `npx prisma migrate deploy`, `npm run db:seed`, then `npm run dev`
- **Testing**: All 99 tests passing (44 unit + 55 integration)
- **Build**: Passes successfully, ready for Vercel deployment
- **Demo Data**: Seed creates 3 users, 2 providers, 20 patients, 30 appointments, 50 availability slots
- **Documentation**: See `/docs` folder for architecture, decisions, schema details, and error handling implementation
- **Code Quality**: TypeScript strict mode, ESLint passing, Prettier formatting

**Project Positioning**: This is a demonstration of healthcare application architecture and security patterns. It shows HIPAA-oriented design considerations but is not a certified, production-ready system for handling real patient data. Suitable as a portfolio/learning project or starting point for a production application that would require additional security hardening, compliance validation, and operational infrastructure.
