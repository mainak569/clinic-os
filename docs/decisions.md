# Technical Decisions

## Decision 1: Next.js 15 App Router

**Chose**: Next.js 15 with App Router

**Rejected**:
- Next.js Pages Router
- Remix
- SvelteKit
- Traditional React SPA with separate API

**Why**: Server Actions let a form call server-side logic directly, without hand-writing an API route and a client-side fetch for every mutation — this app has around a dozen distinct write operations (appointments, patients, providers, visit notes, alerts), so that saved real boilerplate. Server Components keep data-fetching code (Prisma queries) out of the client bundle by default. Both are first-class in the App Router, not retrofitted.

**Trade-offs**:
- Server vs. client component boundaries take some getting used to, and a few UI libraries needed the `"use client"` boundary drawn carefully
- App Router is newer than Pages Router, so fewer existing answers to lean on when something doesn't work as documented

---

## Decision 2: Prisma + Supabase

**Chose**: Prisma ORM with Supabase PostgreSQL

**Rejected**:
- Direct SQL queries
- Drizzle ORM
- TypeORM
- MongoDB with Mongoose
- Firebase Firestore
- Self-hosted PostgreSQL

**Why**: Prisma's generated types keep the schema, the query results and the TypeScript types in one place — a column rename is a compile error everywhere it's used, not a runtime surprise. Its migration history gives a reviewable, versioned record of schema changes (`prisma/migrations/`), which matters for an app with an append-only audit trail. Supabase gives managed Postgres with connection pooling (PgBouncer) out of the box, which the booking lock's advisory-lock pattern depends on behaving correctly under load.

**Trade-offs**:
- Some Supabase-specific behavior (the pooler's transaction mode, in particular — see Decision 14) to work around rather than being purely portable SQL
- Prisma's query builder is less flexible than raw SQL for a few of the more complex reporting queries (analytics), which fall back to `groupBy` or raw queries where needed
- Migrations are a separate, explicit step (`prisma migrate deploy`), not automatic on deploy

---

## Decision 3: NextAuth.js v5 (Auth.js)

**Chose**: NextAuth.js v5 with Credentials provider

**Rejected**:
- Clerk
- Auth0
- Supabase Auth
- Custom JWT implementation
- Session-based auth with cookies only
- Firebase Auth

**Why**: Auth stays in the app's own database rather than a third-party identity provider, which matters for a healthcare-adjacent app where user accounts are tied directly to provider records. NextAuth's middleware integration covers route protection for the whole `/dashboard` tree in one place, and its JWT sessions need no session store, which fits a serverless deployment.

**Trade-offs**:
- More setup than a managed auth provider (Clerk, Auth0) — password hashing, lockout logic and session handling are this app's own code, not a vendor's
- No built-in user-management UI; provider accounts are created and deactivated through the app's own provider-management page

**Why Credentials Provider**:
- Healthcare requires direct password control
- No dependency on external OAuth providers
- Can implement custom password policies
- Keeps all auth data in our own database, which would simplify a future HIPAA compliance effort (the app itself is not compliance-certified)

---

## Decision 4: Service Layer Architecture

**Chose**: Separate service layer with business logic

**Rejected**:
- Fat controllers (logic in actions/API routes)
- Fat models (logic in Prisma model classes)
- Procedural code without clear structure

**Why**:
- **Separation of Concerns**: Business logic separate from HTTP/action layer
- **Testability**: Services can be unit tested independently
- **Reusability**: Same logic used by Server Actions and API routes
- **Domain Modeling**: Services represent business domains
- **Maintainability**: Clear place for business rules and validation

**Example Structure**:
```typescript
// Service handles business logic
class AppointmentService {
  async createAppointment(data, performedBy) {
    // 1. Business rules (not in the past, patient/provider bookable)
    // 2. Check availability
    // 3. Under a per-provider lock: detect conflicts, create appointment
    // 4. Record appointment history
    // 5. Return result
  }
}

// Action owns auth, validation and audit, then delegates
export async function createAppointment(input) {
  const session = await requireAuth();
  const data = createAppointmentSchema.parse(input);
  const appointment = await appointmentService.createAppointment(data, session.user.id);
  await auditService.log({ /* ... */ });
  return { success: true, data: { id: appointment.id } };
}
```

**Trade-offs**:
- More files and folders
- Indirection (action -> service -> database)
- Can be overkill for simple CRUD

**In practice**: The API route `POST /api/appointments` originally wrote directly
to the database and skipped availability, conflict and audit checks. It now
calls the same service, which is the point of the pattern: one path per write.

---

## Decision 5: State Machine for Appointments

**Chose**: Explicit state machine with validation

**Rejected**:
- Free-form status updates
- Boolean flags (isConfirmed, isCompleted, etc.)
- Status codes without transitions

**Why**:
- **Business Rules**: Healthcare workflows have strict rules
- **Data Integrity**: Invalid transitions prevented at code level
- **Audit Trail**: State changes logged automatically
- **Clarity**: Clear states and transitions
- **Error Prevention**: Can't skip steps (e.g., complete without check-in)

**State Machine**:
```
REQUESTED -> CONFIRMED -> CHECKED_IN -> COMPLETED
         |            |
     CANCELLED    NO_SHOW
```

**Rules Enforced**:
- CONFIRMED only from REQUESTED, and only before the start time
- CHECKED_IN only from CONFIRMED, from an hour before the start until the visit ends
- COMPLETED only from CHECKED_IN, after the start time
- NO_SHOW only from CONFIRMED, after the start time
- CANCELLED only before CHECKED_IN, with a reason; a CONFIRMED appointment can't be cancelled once it has started (an unconfirmed request can)
- Rescheduling only while REQUESTED or CONFIRMED
- Can't reopen COMPLETED, NO_SHOW or CANCELLED appointments
- A change applies only if the status hasn't changed since it was read, so two people can't both move the same appointment

The timing rules live in `lib/appointment-rules.ts`, shared by the service (which enforces them) and the appointments table (which only offers allowed actions).

**Trade-offs**:
- More complex than simple status field
- Requires validation logic in service layer
- Can't easily handle edge cases outside the state machine

---

## Decision 6: Zod for Validation

**Chose**: Zod for runtime validation

**Rejected**:
- Yup
- Joi
- TypeScript-only validation
- Class-validator
- Manual validation

**Why**: TypeScript types are compile-time only — they don't stop a malformed request body from reaching a Server Action. Zod validates the same shape at runtime and infers the TypeScript type from the schema, so the validation rule and the type can't drift apart. Every write schema is shared between the form (via a resolver) and the Server Action, so client and server enforce the same rules from one definition.

**Example**:
```typescript
const appointmentSchema = z.object({
  patientId: z.string().cuid(),
  providerId: z.string().cuid(),
  scheduledAt: z.date(),
  type: z.enum(['CONSULTATION', 'FOLLOW_UP', 'PROCEDURE']),
});

type AppointmentInput = z.infer<typeof appointmentSchema>;
```

**Trade-offs**:
- Adds bundle size (~13KB minified)
- Complex schemas can be verbose
- Learning curve for advanced features

---

## Decision 7: TanStack React Query

**Chose**: React Query for server state management

**Rejected**:
- Redux / Redux Toolkit
- Zustand
- SWR
- Custom fetch with useState
- Apollo Client (for GraphQL)

**Why**: The dashboard's data — appointments, alerts, analytics — is server state, not client state: it doesn't originate in the browser and needs to stay in sync with what other users are doing. React Query's caching and refetch-on-focus behavior fit that better than managing loading/error/data state by hand with `useState`.

**Trade-offs**: Adds a library and a query-key convention to learn; overkill for the handful of one-off reads that don't need caching.

---

## Decision 8: shadcn/ui Components

**Chose**: shadcn/ui (copy-paste components)

**Rejected**:
- Material-UI (MUI)
- Chakra UI
- Ant Design
- Headless UI + custom styles
- Building everything from scratch

**Why**: shadcn/ui components are copied into the repository rather than imported from a package, built on Radix UI primitives — which handle keyboard navigation, focus trapping and ARIA roles for dialogs, dropdowns and popovers correctly by default, rather than needing to be built from scratch. Owning the component source made it straightforward to restyle every component into the app's glass/purple visual identity without fighting a component library's own theming API.

**Trade-offs**: No `npm update` for these components — updates and any upstream fixes have to be applied by hand; more component code lives in the repository than with a package dependency.

---

## Decision 9: bcrypt for Password Hashing

**Chose**: bcrypt with cost factor 10

**Rejected**:
- argon2
- scrypt
- PBKDF2
- SHA-256 (insecure)
- Plain text (extremely insecure)

**Why**: bcrypt is deliberately slow, which is the property that matters for password storage — it makes brute-forcing a stolen hash expensive, and the cost factor can be raised later as hardware gets faster without changing the algorithm. Salting is automatic per password, so identical passwords don't produce identical hashes.

**Cost Factor 10**:
- ~100ms to hash (good UX, secure)
- Can increase to 12 or 14 as hardware improves
- Balance between security and performance

**Trade-offs**:
- Slower than SHA-256 (this is intentional)
- argon2 is theoretically more secure (but bcrypt is sufficient)
- bcrypt has 72-byte password limit (not an issue in practice)

---

## Decision 10: Monorepo (Single Package)

**Chose**: Single Next.js application (not monorepo)

**Rejected**:
- Turborepo monorepo
- Nx monorepo
- Separate frontend/backend repos
- Microservices architecture

**Why**: Next.js is already full-stack (Server Actions and API routes live alongside the UI in one app), so there's no separate backend to coordinate with — one deploy, one set of TypeScript types shared automatically between server and client code. A monorepo's benefit is coordinating multiple deployable packages; there's only one here.

**When to Split**:
- Mobile app needs separate API
- Multiple teams working independently
- Distinct services with different scaling needs
- Microservices architecture required

**Trade-offs**:
- All code in one repository
- Can't deploy frontend/backend independently
- Single build process

---

## Decision 11: Environment Variable Strategy

**Chose**: A committed `.env.example` template plus one local, gitignored `.env`

**Rejected**:
- Committing a `.env` with defaults (it ends up holding real connection strings)
- Hardcoded configuration
- Config files (JSON, YAML)
- Environment variables only (no files)

**Why**:
- **One file for local setup**: Next.js, Prisma's CLI and the seed script all read `.env` (Prisma doesn't read `.env.local`)
- **Security**: Real values are never committed; production values live in Vercel's environment settings
- **Discoverability**: `.env.example` lists every variable the code reads

**Files**:
- `.env` - Local values, gitignored
- `.env.example` - Committed template listing every variable
- Vercel project settings - Production values, including `CLINIC_TIMEZONE` and `CRON_SECRET`

**Trade-offs**:
- Easy to forget to update `.env.example` when adding a variable
- No startup validation: a missing variable fails at first use

---

## Decision 12: No Real-Time Features (Initially)

**Chose**: Standard HTTP requests, no WebSockets

**Rejected**:
- WebSockets
- Server-Sent Events
- Supabase Realtime
- Polling for real-time updates
- Socket.io

**Why**: Front desk and providers work from the same dashboard but not typically the same appointment at the same instant, so stale data is a refresh away, not a correctness problem. Standard HTTP with revalidation after each mutation is simpler to reason about and deploy than a WebSocket connection, for a workflow that doesn't need sub-second updates.

**When to Add Real-Time**:
- Chat between staff and patients
- Live appointment status updates
- Collaborative note editing
- Dashboard that needs to update without refresh

**Trade-offs**:
- Need to manually refresh to see updates
- No instant notifications
- Can't see when others are editing same record

---

## Decision 13: Slot Times as Clinic Wall-Clock Time

**Chose**: Store availability times as wall-clock values on a fixed date
(`1970-01-01`, UTC fields) and compare appointments on the clinic's clock via
`CLINIC_TIMEZONE`

**Rejected**:
- Storing browser-local instants and reading them with server-local `getHours()` (the original approach)
- Postgres `TIME` columns (a schema migration for a problem the encoding already solves)
- Storing minutes-after-midnight integers (also a schema change)

**Why**:
- A slot like "Mondays 09:00" is not an instant; it has no date or zone of its own
- The original approach gave two encodings in one table and shifted every slot
  by the server's offset. In live data, an 8 AM–12 PM slot displayed as 1:30–5:30 PM
- A fixed date makes the unique index and overlap checks meaningful
- No schema change: existing rows were converted by a one-off data migration

**Trade-offs**:
- One timezone per deployment; multi-location clinics would need a zone per provider or location
- Anyone reading the raw column must know the encoding (documented in `lib/clinic-time.ts` and `schema.md`)

---

## Decision 14: Per-Provider Advisory Lock for Booking

**Chose**: Run the conflict check and the insert in one transaction that takes
`pg_advisory_xact_lock(hashtext(providerId))`

**Rejected**:
- Check-then-insert without a lock (the original; two simultaneous requests could both pass)
- A database exclusion constraint on time ranges (needs a range column and a schema change)
- SERIALIZABLE isolation with retries (more moving parts, retry logic in every caller)
- An in-process mutex (useless across serverless instances)

**Why**:
- Bookings for one provider take turns; other providers are unaffected
- A transaction-scoped lock is released automatically, which works through
  Supabase's pooler in transaction mode
- Verified both on the local test database and through the Supabase pooler:
  two simultaneous bookings for the same slot, exactly one succeeds

**Trade-offs**:
- Requests for the same provider queue briefly under contention
- Postgres-specific

---

## Decision 15: Soft Delete That Restores on Re-Registration

**Chose**: Keep soft-deleted patients' email and phone, and restore the archived
record when the same person is registered again

**Rejected**:
- Clearing email/phone on delete (loses contact history)
- Partial unique indexes that ignore inactive rows (schema change; and would
  allow a second record for the same person)
- Hard delete (breaks appointment history)

**Why**:
- Email and phone are unique, so a second row for a deleted patient failed at the database
- Restoring keeps one record per person with their full appointment history

**Trade-offs**:
- "Create" can return an existing (restored) record
- If the email and phone belong to two different archived records, the user must pick different details

---

## Decision 16: Server Action Result Contract

**Chose**: Every Server Action returns `{ success: true, data }` or
`{ success: false, error }`, where `error` is a readable message, and the client
never retries a `success: false` result

**Rejected**:
- Returning `error.message` for everything (a ZodError message is a JSON dump of issues)
- Retrying any failure by default (the original mutation hook did this, up to 3 times)

**Why**:
- Users see the first validation issue in plain language
- A rejected write is a decision, not a glitch; retrying it can only repeat the
  rejection, or duplicate a write whose response was lost
- Only transport failures (network, timeout) and 5xx server errors are retried

**Trade-offs**:
- Only the first validation issue is surfaced; forms show the rest inline

---

## Decision 17: Animated WebGL Background

**Chose**: One animated "molten metal" background (ogl, WebGL2) on every route, over the existing glass background

**Rejected**:
- A background animation per page (inconsistent, and more GPU contexts)
- CSS-only animated gradients (couldn't produce the effect)
- Keeping the dashboard static (the product owner wanted one look across the app)

**Why**:
- Gives the product one recognisable look, from the landing page to the dashboard
- The static glass background stays underneath as the fallback, so nothing breaks without WebGL2

**Trade-offs**:
- Continuous rendering costs battery and GPU, most noticeably on the dashboard where glass panels blur over it
- Readability needs care: page headings got darker text with a soft halo, and cards became more opaque
- Mitigations: pauses when the tab is hidden, renders at reduced resolution, and shows a single still frame for reduced motion

---

## Summary

These decisions prioritize:
1. **Developer Experience**: TypeScript, Prisma, React Query
2. **Type Safety**: Zod, Prisma, TypeScript strict mode
3. **Simplicity**: Single codebase, standard architecture
4. **Modern Stack**: Next.js 15.5, React 18, latest libraries
5. **Security**: bcrypt, NextAuth, audit logging
6. **Scalability**: Service layer, Supabase, connection pooling
7. **Data Integrity**: One write path per operation, clinic-time slots, serialized booking

Most decisions can be changed if requirements evolve, but these provide a solid foundation for the MVP.
