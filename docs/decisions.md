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
- Better for HIPAA compliance (all auth data in our database)

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
  async createAppointment(data) {
    // 1. Validate business rules
    // 2. Check availability
    // 3. Detect conflicts
    // 4. Create appointment
    // 5. Create audit log
    // 6. Return result
  }
}

// Action is thin wrapper
export async function createAppointment(data) {
  const session = await requireAuth();
  return appointmentService.createAppointment(data);
}
```

**Trade-offs**:
- More files and folders
- Indirection (action -> service -> database)
- Can be overkill for simple CRUD

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

**Chose**: Multiple environment files with clear naming

**Rejected**:
- Single .env file for all environments
- Hardcoded configuration
- Config files (JSON, YAML)
- Environment variables only (no files)

**Why**:
- **Clear Separation**: Different files for dev, test, prod
- **Next.js Support**: Next.js loads .env files automatically
- **Security**: Sensitive values not in code
- **Type Safety**: Can validate env vars at startup
- **Git Ignore**: .env.local ignored, .env.example committed

**Files**:
- `.env` - Defaults, safe to commit
- `.env.local` - Local overrides, gitignored
- `.env.example` - Template for developers
- `.env.example.production` - Production template

**Trade-offs**:
- Need to manage multiple files
- Easy to forget to update .env.example
- Can be confusing which file takes precedence

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

## Summary

These decisions prioritize:
1. **Developer Experience**: TypeScript, Prisma, React Query
2. **Type Safety**: Zod, Prisma, TypeScript strict mode
3. **Simplicity**: Single codebase, standard architecture
4. **Modern Stack**: Next.js 15, React 18, latest libraries
5. **Security**: bcrypt, NextAuth, audit logging
6. **Scalability**: Service layer, Supabase, connection pooling

Most decisions can be changed if requirements evolve, but these provide a solid foundation for the MVP.
