# Development Plan

## Project Timeline

This document tracks how the work was broken down and executed.

## Sessions & Work Breakdown

### Session 1: Foundation & Setup
- **Duration**: ~3 hours
- **Work**:
  - Next.js 15 project initialization
  - TypeScript strict mode configuration
  - Tailwind CSS + shadcn/ui setup
  - Basic landing page
  - Project structure planning

### Session 2: Database & Authentication
- **Duration**: ~5 hours
- **Work**:
  - Prisma schema design (User, Provider, Patient models)
  - Supabase connection setup
  - NextAuth.js v5 configuration
  - Credentials provider implementation
  - Login page and protected routes
  - Middleware for route protection

### Session 3: Core Domain - Appointments
- **Duration**: ~6 hours
- **Work**:
  - Appointment model and relationships
  - Service layer architecture
  - State machine implementation
  - Server Actions for appointment CRUD
  - Appointment list and create forms
  - Business logic (availability checking, conflict detection)

### Session 4: Scheduling & Availability
- **Duration**: ~5 hours
- **Work**:
  - AvailabilitySlot model
  - Bulk availability creation
  - Provider schedule management
  - Calendar views (week, month and list)
  - Collision detection logic

### Session 5: Visit Notes & Documentation
- **Duration**: ~4 hours
- **Work**:
  - VisitNote model with history tracking
  - SOAP format implementation
  - Vital signs fields
  - Immutable history (VisitNoteHistory model)
  - Edit tracking and audit trail

### Session 6: Alerts & Notifications
- **Duration**: ~3 hours
- **Work**:
  - Alert model and service
  - 24-hour appointment reminders
  - 1-hour urgent alerts
  - Smart deduplication logic
  - Alert UI components
  - Auto-refresh functionality

### Session 7: Analytics Dashboard
- **Duration**: ~4 hours
- **Work**:
  - Analytics service with aggregation queries
  - Recharts integration
  - 3 chart types (bar, pie, line)
  - Summary cards
  - Query optimization (groupBy, parallel execution)
  - Dashboard layout

### Session 8: Testing Suite
- **Duration**: ~6 hours
- **Work**:
  - Jest + ts-jest configuration
  - Test database setup documentation
  - Test utilities and helpers
  - Integration tests (55):
    - Security and unauthorized access (15 tests, `security-tests.test.ts`)
    - Appointment state machine (12 tests, `appointment-state-machine.test.ts`)
    - Authorization and access control (12 tests, `authorization.test.ts`)
    - Duplicate booking prevention (10 tests, `duplicate-bookings.test.ts`)
    - Appointment workflow (6 tests, `appointment-workflow.test.ts`)
  - Unit tests (102):
    - Appointment service (25 tests, `appointment-service.test.ts`)
    - Validation schemas (13 tests, `validation.test.ts`)
    - Authorization helpers (13 tests, `auth-helpers.test.ts`)
    - Clinic time conversion (9 tests, `clinic-time.test.ts`, added in Session 11)
    - Analytics provider isolation (12 tests, `analytics-scope.test.ts`, added in Session 11)
    - Appointment details view (10 tests, `appointment-details.test.ts`, added in Session 11)
    - API route and cron authentication (11 tests, `api-auth.test.ts`, added in Session 11)
    - Alerts and hardening (9 tests, `alerts-and-hardening.test.ts`, added in Session 11)
  - Counts reflect the current suite (157 tests) as reported by `npm test`

### Session 9: Security & Audit
- **Duration**: ~5 hours
- **Work**:
  - HIPAA audit logging (AuditLog model)
  - Audit service implementation
  - Security headers configuration
  - Rate limiting (memory-based)
  - Sentry configuration files (not yet initialised)
  - PHI sanitization in error reports
  - Authorization helpers enhancement

### Session 10: Polish & Documentation
- **Duration**: ~3 hours
- **Work**:
  - Code cleanup and refactoring
  - Documentation writing
  - README updates
  - Deployment guides
  - Environment variable templates
  - Bug fixes and edge cases

### Session 11: UI Consistency & Data Integrity Audit
- **Duration**: not tracked
- **Work**:
  - Shared dashboard layout and navigation for every protected route
  - One glass design system and one appointment status palette across the app
  - Fixed the production build (zod v4 and react-day-picker v9 API changes)
  - Replaced estimated dashboard numbers with real database counts
  - Audited database, backend and frontend for inconsistencies (see Phase 6)
  - Provider management (add, edit, deactivate/reactivate)
  - Canonical slot time encoding and a data migration for existing slots
  - Per-provider booking lock and corrected overlap detection
  - Scoped every analytics query to the signed-in provider
  - Fixed the appointment details dialog: visit notes can be written again, the History tab loads, and other providers' appointments are refused
  - API routes return 401 without a session instead of a 500 or a 409 "NEXT_REDIRECT"
  - Final review: alert de-duplication and ownership, cron secret, sign-in lockout, and removal of stray scripts and invented landing-page figures
  - Test suite grown from 99 to 157 tests

**Total Time**: ~40–44 hours (Sessions 1–10)

## Build Order & Rationale

### Phase 1: Foundation (Sessions 1-2)
**Order**: Setup → Auth → Database

**Why**:
- Need working foundation before building features
- Authentication required for all protected features
- Database schema must be stable early

**Challenges**:
- NextAuth v5 had sparse documentation (used v4 patterns)
- Supabase connection pooling required special configuration

### Phase 2: Core Features (Sessions 3-5)
**Order**: Appointments → Scheduling → Visit Notes

**Why**:
- Appointments are the core domain model
- Scheduling enables appointment creation
- Visit Notes depend on completed appointments

**Challenges**:
- State machine complexity (many edge cases)
- Availability checking across time zones (the first implementation depended on
  the server's timezone; resolved in Session 11 with wall-clock slot times)
- Conflict detection performance

### Phase 3: Value-Add Features (Sessions 6-7)
**Order**: Alerts → Analytics

**Why**:
- Alerts provide immediate value (operational efficiency)
- Analytics provide business insights
- Both depend on appointment data

**Challenges**:
- Alert deduplication logic
- Query optimization for analytics
- Chart library integration

### Phase 4: Quality & Security (Sessions 8-9)
**Order**: Testing → Security → Audit

**Why**:
- Testing validates correctness
- Security protects data
- Audit trail ensures compliance

**Challenges**:
- Test database configuration
- Sentry PHI sanitization
- Rate limiting implementation

### Phase 6: Consistency Audit (Session 11)
**Order**: UI consistency → database/backend/frontend audit → fixes → live verification

**What the audit found**:
1. Availability slots stored in two encodings and read in the server's timezone
2. A short visit could be booked inside a longer one; concurrent requests could double-book
3. Deleted patients couldn't be re-registered (unique email/phone kept by soft delete)
4. Provider patient lists paginated in memory
5. No way to add a provider outside the seed script
6. `POST /api/appointments` bypassed the service layer
7. Visit-note vitals unbounded, uncleareable, and returned as Decimal objects
8. Raw JSON validation errors, automatic retries of rejected writes, revalidation of non-existent routes
9. A provider's dashboard showed the whole clinic's status breakdown and no-show trend, and standalone analytics actions returned clinic-wide data

**How it was verified**: 157 automated tests, plus scripted checks against the
live Supabase database using temporary QA records that were removed afterwards.

### Phase 5: Documentation (Session 10)
**Order**: Code cleanup → Documentation → Deployment guides

**Why**:
- Clean code is easier to document
- Documentation while implementation is fresh
- Deployment guides needed for production

## Estimates vs. Actuals

### What Took Longer Than Expected

1. **NextAuth.js v5 Integration** (Estimated: 2 hours, Actual: 4 hours)
   - **Why**: v5 documentation incomplete, had to reference v4 and migrate
   - **Lesson**: Budget extra time for beta/new libraries

2. **State Machine Implementation** (Estimated: 3 hours, Actual: 6 hours)
   - **Why**: Many edge cases and business rules
   - **Lesson**: Complex business logic always takes longer than expected

3. **Testing Setup** (Estimated: 2 hours, Actual: 4 hours)
   - **Why**: Test database configuration and Jest setup challenges
   - **Lesson**: Testing infrastructure is often underestimated

4. **Alert Deduplication** (Estimated: 1 hour, Actual: 3 hours)
   - **Why**: Complex logic to prevent duplicate alerts
   - **Lesson**: "Simple" features often have hidden complexity

5. **Bulk Availability** (Estimated: 2 hours, Actual: 4 hours)
   - **Why**: Collision detection and date handling complexity
   - **Lesson**: Date/time logic is always tricky. It stayed tricky: the date-range
     loop created one attempt per calendar date for what are weekly slots, and was
     simplified to one slot per weekday in Session 11

### What Took Less Time Than Expected

1. **Analytics Dashboard** (Estimated: 8 hours, Actual: 4 hours)
   - **Why**: Recharts is well-designed, Prisma groupBy is powerful
   - **Lesson**: Good libraries accelerate development

2. **Audit Logging** (Estimated: 8 hours, Actual: 5 hours)
   - **Why**: Simple model, clear requirements
   - **Lesson**: Well-defined requirements speed up implementation

3. **Security Headers** (Estimated: 2 hours, Actual: 1 hour)
   - **Why**: Next.js makes it easy to add headers
   - **Lesson**: Some tasks are simpler than they seem

4. **shadcn/ui Integration** (Estimated: 4 hours, Actual: 2 hours)
   - **Why**: Copy-paste components, excellent documentation
   - **Lesson**: Good developer experience matters

## What Was Cut

### P1 Features (Pushed to Post-MVP)

1. **Input Sanitization (DOMPurify)**
   - **Why Cut**: Time constraint, lower priority than core features
   - **Impact**: XSS risk if users enter HTML
   - **Mitigation**: React escapes by default, Zod validates input

2. **Session Timeout (Inactivity)**
   - **Why Cut**: Non-critical for MVP
   - **Impact**: Sessions last 30 days regardless of activity
   - **Mitigation**: Can manually logout

3. **Password Complexity Requirements**
   - **Why Cut**: Lower priority than core functionality
   - **Impact**: Users can choose weak passwords
   - **Mitigation**: Passwords still hashed with bcrypt

4. **Redis Rate Limiting**
   - **Why Cut**: Memory-based sufficient for single server
   - **Impact**: Won't work with multiple servers
   - **Mitigation**: Document as future improvement

5. **Cursor Pagination**
   - **Why Cut**: Offset pagination is enough for small datasets
   - **Impact**: Performance issues with 1,000+ records
   - **Mitigation**: Add when needed

### P2 Features (Not Planned for MVP)

1. **Multi-Factor Authentication (MFA)**
   - **Why Cut**: Complex, time-consuming
   - **Decision**: Nice-to-have, not required for MVP

2. **Email/SMS Notifications**
   - **Why Cut**: Requires external services, complex setup
   - **Decision**: Manual notifications sufficient for MVP

3. **Patient Portal**
   - **Why Cut**: Major feature, doubles scope
   - **Decision**: Provider-only interface for MVP

4. **Telemedicine/Video**
   - **Why Cut**: Out of scope for appointment management
   - **Decision**: Separate product if needed

5. **Mobile Apps**
   - **Why Cut**: Responsive web app sufficient
   - **Decision**: Native apps if demand exists

### Features Cut During Development

1. **Appointment Confirmation Workflow**
   - **Original Plan**: Email/SMS confirmation with link
   - **Actual**: Manual confirmation in dashboard
   - **Why**: Email service integration scope too large

2. **Advanced Recurring Appointments**
   - **Original Plan**: "Every 2 weeks for 6 months" scheduling
   - **Actual**: Create appointments individually
   - **Why**: Complex edge cases, diminishing returns

3. **Provider Vacation/Time-Off**
   - **Original Plan**: Dedicated time-off management
   - **Actual**: Archive availability slots temporarily
   - **Why**: Availability system covers the use case

4. **Billing Integration**
   - **Original Plan**: Payment processing
   - **Actual**: Cost tracking only (no payments)
   - **Why**: Out of scope, requires PCI compliance

5. **Document Upload**
   - **Original Plan**: Upload lab results, x-rays, etc.
   - **Actual**: Text fields only
   - **Why**: File storage and security complexity

## Lessons Learned

### Technical Lessons

1. **Next.js App Router is powerful but different**
   - Server Components change mental model
   - Server Actions simplify data mutations
   - Learning curve is real

2. **Prisma is excellent for development**
   - Type safety is invaluable
   - Migrations are straightforward
   - Prisma Studio accelerates debugging

3. **Service layer prevents chaos**
   - Business logic in one place
   - Testable independently
   - Reusable across actions/routes

4. **State machines clarify business rules**
   - Explicit transitions prevent bugs
   - Documentation is the code
   - Easy to add validation

5. **Consistency needs one source of truth per concept**
   - Status colours, slot time encoding and write paths had each drifted into several copies
   - Every copy became a place for the frontend, backend and database to disagree
   - A shared module per concept (and a single service per write) prevents it

6. **Testing requires upfront investment**
   - Setup takes time
   - Pays off in confidence
   - Catches edge cases early

### Process Lessons

1. **Build working features incrementally**
   - Don't gold-plate
   - Ship minimum viable, iterate
   - User feedback > assumptions

2. **Documentation while building**
   - Easier when fresh in mind
   - Helps clarify thinking
   - Prevents forgotten details

3. **Spike complex features first**
   - De-risk unknowns early
   - Prevents late surprises
   - Informs estimates

4. **Cut features, not quality**
   - Better to have fewer polished features
   - Technical debt compounds
   - Security/testing not optional

5. **Time estimation is hard**
   - Complex features take 2x estimate
   - Simple features take 0.5x estimate
   - Buffer for unknowns

## If I Had 12 More Hours

See [What Would You Do Next, With Another 12 Hours?](../SUBMISSION.md#what-would-you-do-next-with-another-12-hours) in SUBMISSION.md, which is the canonical answer.

## What I'm Least Happy With

See [What Are You Least Happy With in This Codebase, and Why?](../SUBMISSION.md#what-are-you-least-happy-with-in-this-codebase-and-why) in SUBMISSION.md, which is the canonical answer.

## Success Metrics

### What Went Well

1. **Core functionality complete**: All essential features work
2. **Type-safe codebase**: TypeScript + Prisma catch errors early
3. **Comprehensive tests**: 157 tests (102 unit + 55 integration) across 13 files covering critical paths, including concurrency and timezone handling
4. **Clean architecture**: Service layer keeps code organized
5. **Security conscious**: Audit logging, rate limiting, headers
6. **Well-documented**: Architecture, decisions, and setup guides

### What Could Be Better

1. **Manual processes**: No automated emails or notifications
2. **Scaling limitations**: Memory-based rate limiting
3. **Missing features**: Password requirements, session timeout
4. **Test setup friction**: Requires manual database configuration
5. **Limited search**: Substring search on name, email and phone only
6. **Single timezone**: One clinic timezone per deployment

### Overall Assessment

**Prototype Status**: **Feature-complete as a demonstration**

The system implements the core appointment management workflows end to end, with role-based access, audit logging, and data integrity safeguards (state machine, double-booking protection, timezone-independent availability). It demonstrates healthcare application architecture and HIPAA-oriented design, and is backed by 157 automated tests.

**Production Readiness**: **Not production-ready, and not for use with real patient data.** This is a student/prototype project for educational purposes. It has not undergone HIPAA compliance validation, and it lacks what a clinic would need before handling PHI: session inactivity timeouts, password complexity and MFA, encryption at rest, distributed rate limiting, audit log retention, backup and recovery procedures, and email notifications.

**Appropriate Uses**: A portfolio or learning project, or a starting point for a production application that would first require the security hardening, compliance validation and operational infrastructure listed in [README.md](../README.md#security-considerations) and [SUBMISSION.md](../SUBMISSION.md#known-limitations).
