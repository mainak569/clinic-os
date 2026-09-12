# ClinicOS

A healthcare practice management prototype built with Next.js 15, TypeScript, and modern web technologies. Designed as a demonstration project with HIPAA-oriented security and auditability considerations for appointment scheduling, provider availability management, and clinical documentation.

**Note**: This is a student/prototype project for educational purposes. It demonstrates healthcare application architecture and security patterns but is not certified for production use with real patient data.

## Features

### Core Functionality

- **Appointment Management**: Create, confirm, check-in, and complete appointments with state machine validation
- **Provider Scheduling**: Manage provider availability with recurring slots and conflict detection
- **Patient Records**: Store patient demographics, medical history, and contact information
- **Visit Notes**: Clinical documentation with SOAP format and vital signs tracking
- **Alerts**: Automated reminders for requested appointments (24-hour and 1-hour notifications)
- **Analytics**: Dashboard with charts showing appointments by provider, status, and no-show rates
- **Audit Logging**: HIPAA-oriented audit trail for data access (demonstration purposes)

### Security & Authorization

- **Authentication**: NextAuth.js v5 with JWT sessions and bcrypt password hashing
- **Role-Based Access**: Provider and Front Desk roles with different permissions
- **Provider Isolation**: Providers can only access their own appointments and patients
- **Security Headers**: XSS, clickjacking, and HTTPS enforcement configured
- **Rate Limiting**: Basic protection against brute-force attacks (100 req/min, memory-based)

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

The project includes 99 passing tests covering:

- **Unit Tests** (44 tests): Validation schemas, appointment service logic, authorization helpers
- **Integration Tests** (55 tests): State machine transitions, authorization boundaries, security controls, duplicate booking prevention

All tests pass successfully. Run with `npm test`.

**Note**: Integration tests require a test database. Tests use mocked authentication and isolated database transactions.

## Documentation

- [Architecture](./docs/architecture.md) - System architecture and design patterns
- [Schema](./docs/schema.md) - Database schema and relationships
- [Decisions](./docs/decisions.md) - Key technical decisions and trade-offs
- [Plan](./docs/plan.md) - Development timeline and lessons learned
- [Development Notes](./docs/development-notes.md) - Testing, debugging, and known limitations
- [AI Prompts](./docs/ai-prompts.md) - AI assistance used during development

## Known Limitations

This is a prototype/demonstration project with the following limitations:

1. **Not HIPAA Certified**: While security patterns follow HIPAA principles, this has not undergone formal compliance validation
2. **Rate Limiting**: Memory-based (single server only). Production would require Redis for distributed systems
3. **Email Notifications**: Not implemented. Appointment confirmations are manual
4. **Password Requirements**: Basic validation only (no complexity enforcement, though passwords are bcrypt-hashed)
5. **Session Management**: No inactivity timeout. Sessions last 30 days
6. **Pagination**: Limited implementation. May have performance issues with large datasets (>1000 records)
7. **Search**: Basic patient name search only. No full-text search capabilities
8. **Audit Log Retention**: No automated retention policy or archival system
9. **Multi-Tenancy**: Designed for single clinic use. Multi-clinic support not implemented
10. **Backup/Recovery**: No automated backup system included

See [docs/development-notes.md](./docs/development-notes.md) for complete list and future improvements.

## Security Considerations

This prototype implements several security best practices:

- Passwords hashed with bcrypt (cost factor 10)
- JWT sessions with HTTP-only cookies
- Role-based access control with provider isolation
- Security headers configured (XSS, clickjacking protection)
- Rate limiting active (100 req/min, memory-based)
- Audit logging for data access events
- Error messages sanitized to avoid information leakage

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

Copyright © 2026 ClinicOS. All rights reserved.

## Contributing

1. Follow TypeScript strict mode requirements
2. Use Prettier for code formatting (`npm run format`)
3. Ensure ESLint passes (`npm run lint`)
4. Write tests for new features
5. Update documentation
6. Test on mobile, tablet, and desktop

For more details, see [docs/development-notes.md](./docs/development-notes.md).
