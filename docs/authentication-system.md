# Authentication & Authorization System

## Overview

ClinicOS uses Auth.js (NextAuth v5) with a credentials provider for secure, production-ready authentication with role-based access control.

## Security Architecture

### Core Security Principles

1. **Never Trust the Frontend**
   - All authorization checks happen server-side
   - Frontend hiding is cosmetic only
   - Backend validates every request

2. **Defense in Depth**
   - Password hashing with bcrypt (cost factor: 12)
   - JWT sessions with encryption
   - HTTP-only cookies prevent XSS
   - CSRF protection built-in
   - Middleware-level route protection

3. **Principle of Least Privilege**
   - Providers can only access their own data
   - Front desk has administrative access
   - Explicit permission checks for every operation

## Authentication Flow

### Login Process

```
1. User submits email + password
   ↓
2. Credentials validated against database
   ↓
3. Password verified with bcrypt
   ↓
4. JWT session created with user claims
   ↓
5. HTTP-only cookie set
   ↓
6. User redirected to dashboard
```

### Session Management

- **Strategy**: JWT (stateless)
- **Duration**: 30 days
- **Storage**: HTTP-only cookies
- **Encryption**: AES-256 via AUTH_SECRET

## Authorization Model

### Roles

```typescript
enum Role {
  FRONT_DESK  // Administrative access
  PROVIDER    // Limited to own data
}
```

### Access Control Rules

| Resource | PROVIDER | FRONT_DESK |
|----------|----------|------------|
| Own appointments | Read/Write | Read/Write |
| Other provider appointments | No access | Read/Write |
| Own patients | Read/Write | Read/Write |
| All patients | No access | Read/Write |
| Own schedule | Read/Write | Read/Write |
| All schedules | Read only | Read/Write |
| Provider profiles | Own only | All |
| User management | No access | Full access |

## Implementation

### File Structure

```
auth.config.ts              # Auth.js configuration
auth.ts                     # NextAuth instance
middleware.ts               # Route protection
lib/auth-helpers.ts         # Authorization utilities
types/next-auth.d.ts        # TypeScript types
app/api/auth/[...nextauth]/ # Auth API routes
app/login/                  # Login page
components/auth/            # Auth components
```

### Key Files

#### `auth.config.ts`
- Credentials provider configuration
- Password verification with bcrypt
- JWT and session callbacks
- Route authorization logic

#### `lib/auth-helpers.ts`
- `requireAuth()` - Require authentication
- `requireRole()` - Require specific role
- `canAccessProviderData()` - Provider isolation check
- `canAccessAppointment()` - Appointment access check
- `canAccessPatient()` - Patient access check

#### `middleware.ts`
- Edge-level route protection
- Runs before requests reach the application
- Redirects unauthenticated users

## Usage Examples

### Server Components

```typescript
import { requireAuth, requireRole } from '@/lib/auth-helpers';

// Require authentication
export default async function Page() {
  const session = await requireAuth();
  // User is authenticated, session available
}

// Require specific role
export default async function AdminPage() {
  const session = await requireRole('FRONT_DESK');
  // User is FRONT_DESK
}
```

### Server Actions

```typescript
'use server';

import { requireAuth, canAccessProviderData } from '@/lib/auth-helpers';

export async function updateAppointment(appointmentId: string, data: any) {
  const session = await requireAuth();
  
  // Get appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  
  // Check provider access
  const canAccess = await canAccessProviderData(appointment.providerId);
  if (!canAccess) {
    throw new Error('Unauthorized');
  }
  
  // Proceed with update
  return prisma.appointment.update({
    where: { id: appointmentId },
    data,
  });
}
```

### API Routes

```typescript
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  const session = await requireAuth();
  
  // User is authenticated
  return Response.json({ data: 'protected data' });
}
```

### Client Components

```typescript
'use client';

import { signIn, signOut } from 'next-auth/react';

// Sign in
await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirect: false,
});

// Sign out
await signOut({ callbackUrl: '/login' });
```

## Security Best Practices

### Password Requirements

- Minimum 8 characters (enforced in UI)
- Bcrypt hashing with cost factor 12
- Password comparison uses timing-safe algorithm
- Failed login attempts logged (via lastLogin)

### Session Security

```typescript
session: {
  strategy: "jwt",           // Stateless
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

### Cookie Configuration

- `httpOnly: true` - Prevents JavaScript access
- `secure: true` - HTTPS only (production)
- `sameSite: 'lax'` - CSRF protection
- Encrypted with AUTH_SECRET

## Provider Data Isolation

### Implementation

```typescript
// Check if user can access provider data
export async function canAccessProviderData(providerId: string) {
  const session = await requireAuth();

  // FRONT_DESK: full access
  if (session.user.role === 'FRONT_DESK') {
    return true;
  }

  // PROVIDER: only own data
  if (session.user.role === 'PROVIDER') {
    return session.user.providerId === providerId;
  }

  return false;
}
```

### Usage Pattern

```typescript
// In any server action or API route
const canAccess = await canAccessProviderData(providerId);
if (!canAccess) {
  throw new Error('Unauthorized: Cannot access other provider data');
}
```

## Patient Data Access

### Rules

- **FRONT_DESK**: Can access all patients
- **PROVIDER**: Can only access patients they have appointments with

### Implementation

```typescript
export async function canAccessPatient(patientId: string) {
  const session = await requireAuth();

  if (session.user.role === 'FRONT_DESK') {
    return true;
  }

  if (session.user.role === 'PROVIDER') {
    // Check if provider has any appointment with this patient
    const hasAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        providerId: session.user.providerId,
      },
    });
    return !!hasAppointment;
  }

  return false;
}
```

## Testing Authentication

### Demo Credentials

**Provider Account:**
```
Email: dr.smith@clinicos.com
Password: DrSmith123!
```

**Front Desk Account:**
```
Email: frontdesk@clinicos.com
Password: FrontDesk123!
```

### Test Scenarios

1. **Login Flow**
   - Visit `/login`
   - Enter credentials
   - Verify redirect to `/dashboard`
   - Check session data

2. **Protected Routes**
   - Try accessing `/dashboard` without login
   - Verify redirect to `/login`

3. **Role Authorization**
   - Login as PROVIDER
   - Try accessing front-desk-only features
   - Verify redirect to `/unauthorized`

4. **Provider Isolation**
   - Login as PROVIDER
   - Try accessing another provider's data
   - Verify authorization error

5. **Logout Flow**
   - Click logout button
   - Verify session cleared
   - Verify redirect to `/login`

## Environment Variables

Required in `.env` and `.env.local`:

```env
# Auth.js secret for JWT encryption
# Generate with: openssl rand -base64 32
AUTH_SECRET="your-secret-key-here"

# Application URL
AUTH_URL="http://localhost:3000"

# Database URLs (for user lookup)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
```

## Troubleshooting

### "Invalid session" error
- Verify AUTH_SECRET is set
- Check cookie domain matches
- Ensure HTTPS in production

### "Unauthorized" errors
- Check role requirements
- Verify providerId is set correctly
- Review authorization helper logic

### Login redirects loop
- Check middleware matcher configuration
- Verify public routes in middleware
- Review callback URL handling

## Production Checklist

- [ ] Set strong AUTH_SECRET (32+ bytes)
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up rate limiting on login endpoint
- [ ] Enable audit logging
- [ ] Configure session timeout
- [ ] Set up password reset flow (future)
- [ ] Enable 2FA (future enhancement)

## Security Auditing

### Logged Events

- User login (lastLogin timestamp)
- Password verification failures
- Authorization check failures
- Session creation/destruction

### Future Enhancements

- Rate limiting on login attempts
- Account lockout after failed attempts
- Password reset functionality
- Two-factor authentication
- Audit log table for all auth events
- IP-based access restrictions