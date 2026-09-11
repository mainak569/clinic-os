# ClinicOS

A healthcare practice management application built with Next.js 15, TypeScript, and modern web technologies. Focuses on appointment scheduling, provider availability management, and clinical documentation.

## Features

### Core Functionality

- **Appointment Management**: Create, confirm, check-in, and complete appointments with state machine validation
- **Provider Scheduling**: Manage provider availability with recurring slots and conflict detection
- **Patient Records**: Store patient demographics, medical history, and contact information
- **Visit Notes**: Clinical documentation with SOAP format and vital signs tracking
- **Alerts**: Automated reminders for requested appointments (24-hour and 1-hour notifications)
- **Analytics**: Dashboard with charts showing appointments by provider, status, and no-show rates
- **Audit Trail**: Comprehensive logging of all data access for compliance

### Security & Authorization

- **Authentication**: NextAuth.js v5 with JWT sessions and bcrypt password hashing
- **Role-Based Access**: Provider and Front Desk roles with different permissions
- **Provider Isolation**: Providers can only access their own appointments and patients
- **Security Headers**: XSS, clickjacking, and HTTPS enforcement
- **Rate Limiting**: Protection against brute-force attacks (100 req/min)

## Tech Stack

- **Framework**: Next.js 15.0.3 (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL via Supabase with Prisma ORM 5.22
- **Authentication**: NextAuth.js v5
- **UI**: Tailwind CSS + shadcn/ui (Radix UI components)
- **Forms**: React Hook Form + Zod validation
- **State**: TanStack React Query 5.102
- **Charts**: Recharts 3.10
- **Testing**: Jest + ts-jest

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (or local PostgreSQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd clinicos
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add your values:
   ```env
   # Supabase connection strings
   DATABASE_URL="postgresql://...@...pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://...@...pooler.supabase.com:5432/postgres"

   # Generate with: openssl rand -base64 32
   AUTH_SECRET="your-secret-key"
   AUTH_URL="http://localhost:3000"
   ```

4. **Set up database**
   ```bash
   # Run migrations
   npx prisma migrate deploy

   # Generate Prisma client
   npx prisma generate

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

**Provider**:
- Email: `dr.smith@clinicos.com`
- Password: `DrSmith123!`

**Front Desk**:
- Email: `frontdesk@clinicos.com`
- Password: `FrontDesk123!`

## Project Structure

```
app/
  actions/              # Server Actions (business logic entry points)
  api/                  # API Routes
  dashboard/            # Protected dashboard page
  login/                # Authentication page

components/
  ui/                   # shadcn/ui components
  appointments/         # Appointment components
  availability/         # Scheduling components
  dashboard/            # Dashboard widgets

lib/
  services/             # Business logic layer
    appointment.service.ts
    availability.service.ts
    alert.service.ts
    audit.service.ts
  validations/          # Zod schemas
  auth-helpers.ts       # Authorization utilities
  prisma.ts             # Prisma client

prisma/
  schema.prisma         # Database schema
  migrations/           # Database migrations
  seed.ts               # Seed data

__tests__/
  integration/          # Integration tests (48 tests)
```

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema changes (dev)
npm run db:migrate      # Create migration
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio

# Testing
npm run test:integration # Run integration tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint errors
npm run format          # Format code with Prettier
npm run type-check      # TypeScript type check
```

## Testing

The project includes 48 integration tests covering:

- Appointment state machine (13 tests)
- Authorization and access control (12 tests)
- Duplicate booking prevention (11 tests)
- Security (12 tests)

**Note**: Tests require a test database to be configured. See [docs/development-notes.md](./docs/development-notes.md) for setup instructions.

## Documentation

- [Architecture](./docs/architecture.md) - System architecture and design patterns
- [Schema](./docs/schema.md) - Database schema and relationships
- [Decisions](./docs/decisions.md) - Key technical decisions and trade-offs
- [Plan](./docs/plan.md) - Development timeline and lessons learned
- [Development Notes](./docs/development-notes.md) - Testing, debugging, and known limitations
- [AI Prompts](./docs/ai-prompts.md) - AI assistance used during development

## Known Limitations

1. **Rate Limiting**: Memory-based (single server only). Upgrade to Redis for multi-server.
2. **Email Notifications**: Not implemented. Appointment confirmations are manual.
3. **Password Requirements**: No complexity enforcement (but passwords are hashed with bcrypt).
4. **Session Timeout**: No inactivity timeout. Sessions last 30 days.
5. **Pagination**: Limited. May have performance issues with very large datasets.
6. **Search**: Basic patient name search only. No full-text search.

See [docs/development-notes.md](./docs/development-notes.md) for complete list and future improvements.

## Security Considerations

- Passwords hashed with bcrypt (cost factor 10)
- JWT sessions with HTTP-only cookies
- Role-based access control with provider isolation
- Security headers configured (XSS, clickjacking protection)
- Rate limiting active (100 req/min)
- Audit logging for all data access
- PHI data sanitized in error reports

**Note**: For production use with real patient data:
1. Implement password complexity requirements
2. Add session timeout on inactivity
3. Configure Redis-based rate limiting for multi-server
4. Set up 7-year audit log retention policy
5. Review and implement remaining security recommendations

## License

Copyright © 2026 ClinicOS. All rights reserved.

## Contributing

1. Follow TypeScript strict mode requirements
2. Use Prettier for code formatting (`npm run format`)
3. Ensure ESLint passes (`npm run lint`)
4. Write tests for new features
5. Update documentation
6. Test on mobile, tablet, and desktop

For more details, see [docs/development-notes.md](./docs/development-notes.md).
