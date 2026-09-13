# Technical Decisions

## Decision 1: Next.js 15 App Router

**Chose**: Next.js 15 with App Router

**Rejected**:
- Next.js Pages Router
- Remix
- SvelteKit
- Traditional React SPA with separate API

**Why**:
- **Server Components**: Reduce client bundle size, better performance
- **Server Actions**: Simplify data mutations without explicit API routes
- **Streaming**: Built-in support for progressive UI loading
- **Vercel Deployment**: Seamless deployment with zero config
- **TypeScript Support**: First-class TypeScript integration
- **Ecosystem**: Largest React framework ecosystem
- **Modern**: App Router is the future of Next.js, Pages Router in maintenance mode

**Trade-offs**:
- Learning curve for Server Components vs client components
- Some libraries not yet compatible with React Server Components
- App Router is newer, less Stack Overflow answers

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

**Why**:

**Prisma**:
- **Type Safety**: Auto-generated TypeScript types from schema
- **Developer Experience**: Intuitive API, great autocomplete
- **Migrations**: Built-in migration system with version control
- **Prisma Studio**: Visual database browser
- **Active Development**: Well-maintained, frequent updates

**Supabase**:
- **Managed PostgreSQL**: No server management required
- **Connection Pooling**: Built-in PgBouncer for connection management
- **Automatic Backups**: Daily backups included
- **Generous Free Tier**: Good for development and small deployments
- **Real-time Subscriptions**: Available if needed later
- **Auth Integration**: Can use Supabase Auth if we outgrow NextAuth

**Trade-offs**:
- Vendor lock-in (Supabase-specific features)
- Prisma can be slower than raw SQL for complex queries
- Migrations require running separate command (not automatic)

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

**Why**:
- **Open Source**: No vendor lock-in, full control
- **Flexible**: Supports many providers (can add OAuth later)
- **Next.js Integration**: Built specifically for Next.js
- **Edge Compatible**: Works with Edge Runtime
- **JWT Sessions**: Stateless, scalable
- **Security**: Built-in CSRF protection, secure cookies
- **Active Development**: Version 5 is the modern rewrite

**Trade-offs**:
- More complex than managed auth (Clerk, Auth0)
- Need to handle password hashing ourselves
- Email verification requires additional setup
- No built-in user management UI

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
- NO_SHOW only from CONFIRMED after scheduled time
- CANCELLED only before CHECKED_IN, requires reason
- COMPLETED only from CHECKED_IN
- Can't reopen COMPLETED or CANCELLED appointments

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

**Why**:
- **TypeScript First**: Designed for TypeScript
- **Type Inference**: Automatically infer types from schemas
- **React Hook Form Integration**: Built-in resolver
- **Composable**: Easy to build complex schemas
- **Error Messages**: Clear, customizable error messages
- **Runtime Safety**: Validates at runtime, not just compile time

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

**Why**:
- **Server State Focus**: Designed specifically for server data
- **Caching**: Automatic caching and revalidation
- **Optimistic Updates**: Built-in optimistic update support
- **Devtools**: React Query Devtools for debugging
- **Refetch Strategies**: Window focus, network reconnect, polling
- **Small Bundle**: ~13KB minified

**Trade-offs**:
- Adds another library to learn
- Overhead for simple GET requests
- Can be complex to set up for mutations

---

## Decision 8: shadcn/ui Components

**Chose**: shadcn/ui (copy-paste components)

**Rejected**:
- Material-UI (MUI)
- Chakra UI
- Ant Design
- Headless UI + custom styles
- Building everything from scratch

**Why**:
- **Copy-Paste**: Own the code, modify as needed
- **Tailwind-based**: Consistent with our styling approach
- **Radix UI Primitives**: Accessible, unstyled components
- **Modern**: Latest React patterns, Server Component compatible
- **No Runtime**: Components copied to codebase (no library overhead)
- **Customizable**: Full control over styling and behavior

**Trade-offs**:
- Need to update components manually (no npm update)
- More code in repository
- No built-in theming system (need to build)

---

## Decision 9: bcrypt for Password Hashing

**Chose**: bcrypt with cost factor 10

**Rejected**:
- argon2
- scrypt
- PBKDF2
- SHA-256 (insecure)
- Plain text (extremely insecure)

**Why**:
- **Proven**: Battle-tested, used by major platforms
- **Slow by Design**: Resistant to brute-force attacks
- **Configurable Cost**: Can increase cost as hardware improves
- **Salting Built-in**: Automatic per-password salts
- **Node.js Library**: Mature, well-maintained library

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

**Why**:
- **Simplicity**: Easier to develop, deploy, and maintain
- **Shared Types**: TypeScript types shared automatically
- **Single Deploy**: One deployment process
- **Small Team**: Monorepo overhead not justified
- **Next.js Full-Stack**: Next.js handles both frontend and backend

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

**Why**:
- **Simpler**: HTTP is simpler than WebSockets
- **Sufficient**: Appointment scheduling doesn't need real-time
- **Scalability**: Easier to scale HTTP than WebSockets
- **Can Add Later**: Can add real-time if needed

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
