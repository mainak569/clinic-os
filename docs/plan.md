# Development Plan

## Timeline

Built solo across 12 sessions, roughly 15-18 hours total. The first 10 sessions built the core feature set; Session 11 was a dedicated audit pass that found and fixed real inconsistencies between the schema, backend and frontend (see below) and grew the test suite from 99 to 179 tests; Session 12 added the authenticated dashboard AI assistant with role-scoped context, guardrails and tests, bringing the suite to 235. Later polish (faster dashboard loads, login-page demo accounts with a 5-provider limit, and a custom 404 page) brought it to 250.

| Phase              | Sessions | ~Hours | Built                                                                                                                                                   | Hardest part                                                                                                                           |
| ------------------ | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Foundation         | 1-2      | 2.5    | Project setup, Prisma schema, NextAuth v5 credentials auth, route protection                                                                            | NextAuth v5's docs were sparse at the time; worked from v4 patterns and migrated                                                       |
| Core domain        | 3-5      | 4.5    | Appointment state machine, availability slots and bulk creation, visit notes with immutable history                                                     | State machine edge cases; availability checking was timezone-dependent until Session 11's wall-clock fix                               |
| Value-add          | 6-7      | 2      | Alert generation and de-duplication, analytics dashboard                                                                                                | De-duplication logic; making the dashboard queries fast with Prisma's `groupBy`                                                        |
| Quality & security | 8-9      | 3      | Test suite (Jest, unit + integration against a real Postgres test DB), audit logging, rate limiting, security headers                                   | Configuring a real test database rather than mocking everything                                                                        |
| Documentation      | 10       | 1      | README, architecture and schema docs, deployment guide                                                                                                  | —                                                                                                                                      |
| Consistency audit  | 11       | 2      | Full backend/frontend/database consistency pass, live-verified against the running app and database                                                     | Finding issues that only showed up under real conditions (timezone, concurrency) — see below                                           |
| AI Assistant       | 12       | 2      | Authenticated dashboard AI assistant: role-scoped context (today's schedule, no patient details), guardrails, streamed Markdown replies, chat interface | Streaming replies while dropping the model's separate reasoning tokens; keeping patient data out of what's sent to a third-party model |

## The Session 11 audit

Sessions 1-10 built features session by session; nothing had been checked end-to-end against a live database until Session 11. That pass compared the schema, validation, services, actions and forms, then verified every fix against the running app and Supabase (with temporary test records, removed afterward), not just the type checker. It found nine real issues — slot times stored inconsistently and read in the server's timezone, a booking race, deleted patients unable to re-register, an API route that bypassed the service layer, a cross-provider data leak in analytics, and others detailed in [SUBMISSION.md](../SUBMISSION.md#a-real-consistency-audit-not-just-feature-work) — all fixed and covered by new tests.

**Takeaway:** the bugs that mattered most weren't caught by the type system or by unit tests with mocked dependencies — they needed a real database, a real clock, and concurrent requests. That's the reason integration tests in this project run against actual PostgreSQL rather than mocks.

## Scope cuts

Cut for time, not because they weren't considered:

| Feature                                   | Why cut                                                       | Left in its place                                     |
| ----------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------- |
| Redis-backed rate limiting                | Single-instance deployment doesn't need it yet                | In-memory limiter, documented as a scaling limitation |
| Cursor-based pagination                   | Offset pagination is fine below ~1,000 records                | Offset pagination                                     |
| Session inactivity timeout                | Non-critical for a demo                                       | 30-day JWT expiry only                                |
| Password complexity rules                 | Lower priority than core functionality                        | bcrypt hashing (all passwords), minimum length only   |
| Email/SMS notifications                   | Requires an external service and templates                    | Alerts shown in the dashboard only                    |
| Multi-factor authentication               | Out of scope for a prototype                                  | —                                                     |
| Patient portal                            | Doubles the scope of the project                              | Provider/front-desk interface only                    |
| Appointment confirmation via emailed link | External email integration was too large a scope add          | Manual confirmation from the dashboard                |
| Recurring appointment series              | Edge cases outweighed the benefit for a demo                  | Appointments created individually                     |
| Document/file upload for visit notes      | File storage and access-control complexity                    | Text fields only                                      |
| Billing/payment processing                | Requires payment infrastructure and additional security scope | Cost tracking field only, no payment flow             |

Full list of what this means for a real deployment: [Scope & Future Work](../SUBMISSION.md#scope--future-work).

## Lessons that changed the design

- **One source of truth per concept.** Status colours, slot-time encoding and the appointment write path had each drifted into more than one copy across the codebase. Every extra copy was a place for the frontend, backend and database to quietly disagree — this is what the Session 11 audit mostly found. The fix in each case was consolidating to one shared module or one service method, not more validation.
- **Mocked tests don't catch timezone or concurrency bugs.** Both of the audit's more serious findings (slot times, the booking race) only reproduced against a real database and real concurrent requests. Integration tests here run against actual PostgreSQL for that reason.
- **A service layer earns its keep the first time two callers need the same rule.** `POST /api/appointments` originally wrote to the database directly and skipped every check the UI's Server Action enforced. Routing it through the same service closed that gap in one change instead of two.

## What's next / self-assessment

- [What Would You Do Next, With Another 12 Hours?](../SUBMISSION.md#what-would-you-do-next-with-another-12-hours) — SUBMISSION.md is the canonical answer.
- [Honest Self-Assessment](../SUBMISSION.md#honest-self-assessment) — SUBMISSION.md is the canonical answer.

## Overall assessment

**Status: feature-complete as a demonstration.** The core appointment-management workflow works end to end, with role-based access, audit logging, and data-integrity safeguards (state machine, double-booking protection, timezone-independent availability) and a role-scoped AI assistant, backed by 250 automated tests.

**Not production-ready, and not for use with real patient data.** This is a student/prototype project. It has not undergone HIPAA compliance validation, and is missing what a real clinic deployment would need first: session inactivity timeouts, password complexity and MFA, encryption at rest, distributed rate limiting, audit log retention, backup and recovery, and email notifications — full list in [Scope & Future Work](../SUBMISSION.md#scope--future-work).

**Appropriate use:** a portfolio/learning project, or a starting point for a production build that would first need the hardening and compliance work listed above.
