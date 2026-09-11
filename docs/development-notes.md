# Development Notes

## Testing

### Test Suite Overview

ClinicOS includes **48 integration tests** organized into 4 test suites:

1. **Appointment State Machine** (13 tests)
   - Valid state transitions
   - Invalid transition prevention
   - Business rule enforcement

2. **Authorization & Access Control** (12 tests)
   - Provider isolation
   - Front desk full access
   - Unauthorized access prevention
   - Role-based restrictions

3. **Duplicate Booking Prevention** (11 tests)
   - Same time slot detection
   - Overlapping appointment prevention
   - Different provider handling

4. **Security Tests** (12 tests)
   - SQL injection prevention
   - XSS attack prevention
   - CSRF protection
   - Authentication bypass attempts

### Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific test file
npm run test:integration -- appointment-state-machine

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Database Setup

Tests require a database. Options:

**Option 1**: Use existing Supabase (quick, but uses real DB)
```bash
npm run test:integration
```

**Option 2**: Local PostgreSQL (recommended for CI/CD)
```bash
# Install PostgreSQL
brew install postgresql@15

# Create test database
createdb clinicos_test

# Set test environment
export DATABASE_URL="postgresql://localhost/clinicos_test"
npx prisma db push

# Run tests
npm run test:integration
```

**Option 3**: Separate Supabase project for testing

### Test Configuration

- **Framework**: Jest + ts-jest
- **Setup**: `__tests__/setup.ts`
- **Location**: `__tests__/integration/`
- **Coverage Target**: 70% (currently at ~85% for core features)

## Known Limitations

### Current Limitations

1. **Rate Limiting**: Memory-based (single server only)
   - Works for MVP and single-server deployments
   - Upgrade to Redis-based for multi-server production
   - See `lib/rate-limit.ts` for implementation

2. **Test Database**: Requires manual setup
   - Tests don't automatically create test database
   - Need to configure before running tests
   - Consider adding test database auto-setup script

3. **Email Notifications**: Not implemented
   - No email sending capability
   - Would require email service (SendGrid, Postmark, etc.)
   - Appointment confirmations currently manual

4. **SMS Notifications**: Not implemented
   - No SMS/text message capability
   - Would require Twilio or similar service

5. **Password Complexity**: Not enforced
   - Passwords stored securely (bcrypt)
   - But no minimum length/complexity requirements
   - Add validation in auth flow

6. **Session Timeout**: No inactivity timeout
   - Sessions last 30 days
   - No automatic logout on inactivity
   - Security improvement for future

7. **Pagination**: Limited implementation
   - Most queries return all results
   - Could cause performance issues with large datasets
   - Add cursor or offset pagination

8. **Search**: Basic search only
   - Patient search by name only
   - No full-text search
   - Consider PostgreSQL full-text search or Elasticsearch

9. **Audit Log Retention**: Manual
   - Audit logs stored indefinitely
   - No automatic archival to cold storage
   - Need retention policy for HIPAA (7 years)

10. **Error Handling**: Basic
    - Generic error messages in some places
    - Could improve user-facing error messages
    - Add error codes for client handling

## Future Improvements

### P1 - High Priority (2-3 weeks)

1. **Input Sanitization**
   - Add DOMPurify for HTML sanitization
   - Prevent XSS attacks in user-generated content
   - Sanitize before displaying, not just before saving

2. **Session Timeout**
   - Implement 30-minute inactivity timeout
   - Warn user before auto-logout
   - Save form data before timeout

3. **Password Requirements**
   - Minimum 8 characters
   - Require: uppercase, lowercase, number, special char
   - Password strength meter
   - Prevent common passwords

4. **Enhanced CSP Headers**
   - Stricter Content Security Policy
   - Remove 'unsafe-inline' and 'unsafe-eval'
   - Nonce-based script execution

5. **Redis Rate Limiting**
   - Replace memory-based with Redis
   - Support multi-server deployments
   - More sophisticated rate limiting rules

6. **Pagination**
   - Implement cursor-based pagination
   - Add page size controls
   - Optimize database queries for large datasets

7. **Search Improvements**
   - Full-text search for patients
   - Search appointments by patient name
   - Search visit notes by content

8. **Error Logging Improvements**
   - Add structured logging
   - Better error categorization
   - Link errors to user actions in audit trail

### P2 - Nice to Have (4-6 weeks)

1. **Multi-Factor Authentication (MFA)**
   - TOTP (Google Authenticator, Authy)
   - SMS-based MFA
   - Recovery codes

2. **Email Notifications**
   - Appointment confirmations
   - Appointment reminders
   - Cancellation notifications
   - Visit note ready notifications

3. **SMS Notifications**
   - Text appointment reminders
   - Confirmation requests
   - Emergency alerts

4. **Advanced Analytics**
   - More chart types
   - Custom date ranges
   - Export reports to PDF/Excel
   - Scheduled reports

5. **Bulk Operations**
   - Bulk appointment cancellation
   - Bulk availability updates
   - Bulk patient import

6. **Appointment Templates**
   - Common appointment types with defaults
   - Quick scheduling
   - Pre-filled forms

7. **Provider Schedules**
   - Vacation/time-off management
   - Recurring schedule patterns
   - Schedule templates

8. **Patient Portal** (major feature)
   - Patient self-scheduling
   - View appointment history
   - View visit notes
   - Upload documents
   - Secure messaging

9. **Mobile Apps** (major feature)
   - React Native apps for iOS/Android
   - Native notifications
   - Offline support

10. **Telemedicine** (major feature)
    - Video calls
    - Screen sharing
    - Chat during appointments
    - Recording (with consent)

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database with demo data
npm run db:seed

# Start development server
npm run dev
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix lint errors
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

### Database Management

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio

# Create new migration
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npm run db:reset

# Push schema changes without migration
npm run db:push
```

### Building for Production

```bash
# Build application
npm run build

# Start production server
npm run start

# Deploy to Vercel
vercel --prod
```

## Environment Setup

### Required Environment Variables

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."  # Transaction Pooler (port 6543)
DIRECT_URL="postgresql://..."    # Direct connection (port 5432)

# Authentication
AUTH_SECRET="<generate with: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"  # Update for production

# Optional: Error Tracking
SENTRY_DSN="https://..."
NEXT_PUBLIC_SENTRY_DSN="https://..."

# Optional: Feature Flags
ENABLE_AUDIT_LOGGING="true"
ENABLE_RATE_LIMITING="true"
ENABLE_ERROR_TRACKING="true"
```

### Generate Secrets

```bash
# AUTH_SECRET (32+ bytes)
openssl rand -base64 32

# For production, also generate:
# - CRON_SECRET (if using Vercel Cron)
openssl rand -base64 32
```

## Common Issues & Solutions

### Build Issues

**Issue**: Prisma client not generated
```bash
# Solution
npx prisma generate
npm run build
```

**Issue**: Module not found errors
```bash
# Solution
rm -rf node_modules .next
npm install
```

### Database Issues

**Issue**: Connection timeout
```bash
# Check:
# 1. DATABASE_URL is correct
# 2. Supabase project is active
# 3. Using Transaction Pooler URL (port 6543)
```

**Issue**: "prepared statement already exists"
```bash
# Solution: Use correct URLs
# DATABASE_URL should use ?pgbouncer=true
# DIRECT_URL should not have ?pgbouncer=true
```

**Issue**: Migration errors
```bash
# Check migration status
npx prisma migrate status

# Force reset (WARNING: deletes data)
npx prisma migrate reset

# Apply migrations
npx prisma migrate deploy
```

### Authentication Issues

**Issue**: JWT_SECRET not defined
```bash
# Solution
openssl rand -base64 32
# Add to .env.local as AUTH_SECRET
```

**Issue**: Redirect loop on /login
```bash
# Check:
# 1. AUTH_URL matches deployment URL
# 2. No trailing slash in AUTH_URL
# 3. AUTH_SECRET is set
```

### Performance Issues

**Issue**: Slow database queries
```bash
# Check:
# 1. Using select to limit columns
# 2. Proper indexes on foreign keys
# 3. Using Supabase Transaction Pooler

# View query performance in Prisma Studio
npm run db:studio
```

**Issue**: Large bundle size
```bash
# Analyze bundle
npm run build

# Check:
# 1. Using dynamic imports for large components
# 2. Not importing entire libraries
# 3. Tree shaking working properly
```

## Debugging

### Server-Side Debugging

```typescript
// In Server Actions or API routes
console.log('Debug info:', data);

// Check server logs in terminal
// Or in Vercel dashboard for production
```

### Client-Side Debugging

```typescript
// In Client Components
console.log('Debug info:', data);

// Check browser console (F12)
```

### Database Debugging

```bash
# View all queries
# Set in .env.local:
DEBUG="prisma:query"

# Then run:
npm run dev

# Or use Prisma Studio
npm run db:studio
```

### Network Debugging

```bash
# In browser DevTools (F12):
# 1. Network tab
# 2. Filter by Fetch/XHR
# 3. Check request/response
# 4. Look for failed requests
```

## Performance Monitoring

### Metrics to Track

1. **Page Load Time**: < 3 seconds
2. **Dashboard Load**: < 500ms
3. **API Response Time**: < 200ms
4. **Database Query Time**: < 100ms
5. **Build Time**: < 60 seconds

### Tools

- **Next.js Analytics**: Built into Vercel deployments
- **Prisma Metrics**: Available in Prisma Studio
- **React DevTools**: Profiler for component performance
- **Lighthouse**: Overall performance audit

## Security Best Practices

### Do's

- Always validate input server-side
- Use parameterized queries (Prisma does this)
- Hash passwords with bcrypt
- Use HTTPS in production
- Enable security headers
- Log all sensitive operations
- Implement rate limiting
- Use HTTP-only cookies for sessions

### Don'ts

- Never trust client-side validation alone
- Never store passwords in plain text
- Never expose internal IDs in URLs
- Never skip authentication checks
- Never trust user input
- Never commit secrets to git
- Never use weak secrets
- Never allow SQL injection (use Prisma)

## Code Organization

### File Naming

- **Components**: PascalCase (`AppointmentForm.tsx`)
- **Utilities**: camelCase (`auth-helpers.ts`)
- **Types**: PascalCase (`types/appointment.ts`)
- **Services**: camelCase with suffix (`appointment.service.ts`)
- **Actions**: camelCase with suffix (`appointment.actions.ts`)

### Component Structure

```typescript
// Imports
import { useState } from 'react';

// Types
interface Props {
  // ...
}

// Component
export function MyComponent({ prop }: Props) {
  // Hooks
  const [state, setState] = useState();

  // Event handlers
  const handleClick = () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Service Structure

```typescript
// Imports
import { prisma } from '@/lib/prisma';

// Types
interface CreateInput {
  // ...
}

// Service class
export class MyService {
  async create(input: CreateInput) {
    // 1. Validate input
    // 2. Check business rules
    // 3. Perform operations
    // 4. Create audit log
    // 5. Return result
  }
}

// Singleton
export const myService = new MyService();
```

## Contributing Guidelines

1. **Follow TypeScript strict mode**: No `any` types
2. **Use Prettier for formatting**: Run `npm run format`
3. **Lint before committing**: Run `npm run lint`
4. **Write tests for new features**: Add to `__tests__/`
5. **Update documentation**: Keep docs in sync with code
6. **Use meaningful commit messages**: Describe what and why
7. **Test responsiveness**: Mobile, tablet, desktop
8. **Check accessibility**: WCAG AA compliance

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Supabase Docs**: https://supabase.com/docs
- **NextAuth Docs**: https://authjs.dev
- **Tailwind Docs**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com
