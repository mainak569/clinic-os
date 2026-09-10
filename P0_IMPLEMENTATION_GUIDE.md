# P0 Items - Implementation Guide

Quick implementation guide for critical production blockers.

---

## 1. HIPAA Audit Logging (2-3 days)

### Step 1: Add Audit Log Model to Prisma Schema

```prisma
// Add to prisma/schema.prisma

enum AuditAction {
  CREATE
  READ
  UPDATE
  DELETE
  EXPORT
  PRINT
}

enum ResourceType {
  APPOINTMENT
  PATIENT
  VISIT_NOTE
  PROVIDER
  USER
}

model AuditLog {
  id          String       @id @default(cuid())
  userId      String       @map("user_id")
  action      AuditAction
  resource    ResourceType
  resourceId  String       @map("resource_id")
  details     String?      // JSON string with additional context
  ipAddress   String?      @map("ip_address")
  userAgent   String?      @map("user_agent")
  timestamp   DateTime     @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([resource, resourceId])
  @@index([timestamp])
  @@index([action])
  @@map("audit_logs")
}
```

### Step 2: Create Audit Service

```typescript
// lib/services/audit.service.ts

import { prisma } from "@/lib/prisma";
import type { AuditAction, ResourceType } from "@prisma/client";

export class AuditService {
  async log(input: {
    userId: string;
    action: AuditAction;
    resource: ResourceType;
    resourceId: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        details: input.details ? JSON.stringify(input.details) : null,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async getAuditTrail(resourceType: ResourceType, resourceId: string) {
    return prisma.auditLog.findMany({
      where: { resource: resourceType, resourceId },
      include: { user: { select: { email: true, role: true } } },
      orderBy: { timestamp: "desc" },
    });
  }
}

export const auditService = new AuditService();
```

### Step 3: Add to Server Actions

```typescript
// app/actions/appointment.actions.ts

import { auditService } from "@/lib/services/audit.service";

export async function getAppointmentById(appointmentId: string) {
  try {
    const session = await requireAuth();
    
    const appointment = await appointmentService.getAppointmentById(appointmentId);
    
    if (!appointment) {
      return { success: false, error: "Not found" };
    }

    // ✅ ADD AUDIT LOG
    await auditService.log({
      userId: session.user.id,
      action: "READ",
      resource: "APPOINTMENT",
      resourceId: appointmentId,
      ipAddress: headers().get("x-forwarded-for") || undefined,
      userAgent: headers().get("user-agent") || undefined,
    });

    return { success: true, data: appointment };
  } catch (error) {
    // ...
  }
}
```

### Step 4: Run Migration

```bash
npx prisma migrate dev --name add-audit-logs
npx prisma generate
```

---

## 2. Error Tracking with Sentry (1 day)

### Step 1: Install Sentry

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Step 2: Configure Sentry

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  debug: false,
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    // Remove sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});
```

### Step 3: Add to Server Actions

```typescript
// app/actions/appointment.actions.ts
import * as Sentry from "@sentry/nextjs";

export async function createAppointment(input: CreateAppointmentInput) {
  try {
    // ... existing code
  } catch (error) {
    console.error("createAppointment error:", error);
    
    // ✅ SEND TO SENTRY
    Sentry.captureException(error, {
      tags: { action: "createAppointment" },
      extra: { input },
    });

    return { success: false, error: "Failed to create appointment" };
  }
}
```

### Step 4: Set Environment Variables

```env
# .env.local
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn
```

---

## 3. Security Headers (2 hours)

### Step 1: Update next.config.js

```javascript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; ')
          }
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

### Step 2: Test Headers

```bash
curl -I https://your-domain.com
# Should see all security headers in response
```

---

## 4. Fix Analytics Authorization (1 hour)

### Update Analytics Actions

```typescript
// app/actions/analytics.actions.ts

export async function getAppointmentsByProvider(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<any[]>> {
  try {
    const session = await requireAuth();

    // ✅ FIX: Check role BEFORE querying
    if (session.user.role !== "FRONT_DESK") {
      return {
        success: false,
        error: "Only front desk can view cross-provider analytics",
      };
    }

    const data = await analyticsService.getAppointmentsByProvider(
      startDate,
      endDate
    );

    return { success: true, data };
  } catch (error) {
    console.error("getAppointmentsByProvider error:", error);
    return { success: false, error: "Failed to get data" };
  }
}

export async function getAppointmentsByStatus(
  startDate?: Date,
  endDate?: Date
): Promise<ActionResult<any[]>> {
  try {
    // ✅ ADD: Authorization check
    const session = await requireAuth();
    
    // Status data is less sensitive, allow both roles
    // But still check authentication

    const data = await analyticsService.getAppointmentsByStatus(
      startDate,
      endDate
    );

    return { success: true, data };
  } catch (error) {
    console.error("getAppointmentsByStatus error:", error);
    return { success: false, error: "Failed to get data" };
  }
}
```

---

## 5. Rate Limiting (2 days)

### Step 1: Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

### Step 2: Create Rate Limit Utility

```typescript
// lib/rate-limit.ts

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Global rate limit: 100 requests per 1 minute
export const globalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  analytics: true,
  prefix: "@ratelimit/global",
});

// Login rate limit: 5 requests per 15 minutes
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@ratelimit/login",
});

// API rate limit: 50 requests per 1 minute per user
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 m"),
  analytics: true,
  prefix: "@ratelimit/api",
});
```

### Step 3: Add to Middleware

```typescript
// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { globalRateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  // Rate limiting
  const identifier = request.ip ?? "anonymous";
  const { success, limit, reset, remaining } = await globalRateLimit.limit(identifier);

  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/:path*",
    "/dashboard/:path*",
  ],
};
```

### Step 4: Add to Login

```typescript
// app/api/auth/[...nextauth]/route.ts

import { loginRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous";
  
  const { success } = await loginRateLimit.limit(ip);
  
  if (!success) {
    return new Response("Too many login attempts", { status: 429 });
  }

  // ... rest of login logic
}
```

### Step 5: Environment Variables

```env
# .env.local
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

Alternative (without Redis):
```typescript
// lib/rate-limit-simple.ts (memory-based, single server only)

const requests = new Map<string, { count: number; reset: number }>();

export function rateLimit(identifier: string, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const record = requests.get(identifier);

  if (!record || now > record.reset) {
    requests.set(identifier, { count: 1, reset: now + windowMs });
    return { success: true };
  }

  if (record.count >= limit) {
    return { success: false };
  }

  record.count++;
  return { success: true };
}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requests.entries()) {
    if (now > value.reset) {
      requests.delete(key);
    }
  }
}, 5 * 60 * 1000);
```

---

## Testing Checklist

### After Implementing P0 Items:

```bash
# 1. Run migrations
npm run db:generate
npm run db:push

# 2. Run all tests
npm run test:integration

# 3. Type check
npm run type-check

# 4. Build check
npm run build

# 5. Manual smoke test
npm run dev
# Test:
# - Login
# - Create appointment
# - View dashboard
# - Check audit logs
# - Trigger rate limit
# - View Sentry errors
# - Verify security headers
```

---

## Deployment Checklist

### Before Deploying:

- [ ] All P0 items implemented
- [ ] All 48 tests passing
- [ ] Sentry configured
- [ ] Rate limiting tested
- [ ] Security headers verified
- [ ] Audit logging working
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Backup strategy configured
- [ ] Monitoring dashboard set up

### During Deployment:

- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Monitor error rates
- [ ] Check audit logs
- [ ] Verify rate limiting
- [ ] Test authentication
- [ ] Deploy to production
- [ ] Monitor for 24-48 hours

### After Deployment:

- [ ] Verify all features working
- [ ] Check error rates in Sentry
- [ ] Review audit logs
- [ ] Monitor performance
- [ ] User acceptance testing
- [ ] Security audit
- [ ] Sign-off from stakeholders

---

## Timeline Summary

| Item | Effort | Dependencies | Priority |
|------|--------|--------------|----------|
| HIPAA Audit Logging | 2-3 days | Prisma migration | P0 |
| Error Tracking | 1 day | Sentry account | P0 |
| Security Headers | 2 hours | None | P0 |
| Authorization Fix | 1 hour | None | P0 |
| Rate Limiting | 2 days | Redis (optional) | P0 |
| **Total** | **5-7 days** | | |

---

## Success Criteria

After implementing P0 items, verify:

1. ✅ All PHI access logged to audit trail
2. ✅ All errors appear in Sentry dashboard
3. ✅ Security headers present in HTTP responses
4. ✅ Only FRONT_DESK can access cross-provider analytics
5. ✅ Rate limits prevent abuse (test with curl)
6. ✅ All 48 integration tests pass
7. ✅ No TypeScript errors
8. ✅ Application builds successfully
9. ✅ Staging environment stable
10. ✅ Production monitoring active

---

## Quick Reference Commands

```bash
# Setup
npm install @sentry/nextjs @upstash/ratelimit @upstash/redis
npx @sentry/wizard -i nextjs
npx prisma migrate dev --name add-audit-logs

# Testing
npm run test:integration
npm run type-check
npm run build

# Deployment
npm run db:push
npm run build
npm run start

# Monitoring
curl -I https://your-domain.com  # Check headers
# Check Sentry dashboard for errors
# Check Prisma Studio for audit logs
```

---

## Support Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- **Upstash Ratelimit**: https://github.com/upstash/ratelimit
- **Next.js Security**: https://nextjs.org/docs/advanced-features/security-headers
- **HIPAA Compliance**: https://www.hhs.gov/hipaa/for-professionals/security/index.html
- **Prisma Audit Logs**: https://www.prisma.io/docs/concepts/components/prisma-client/logging

---

## Conclusion

Implementing these P0 items will bring the system to **production-ready status** with:

- ✅ HIPAA compliance through audit logging
- ✅ Operational visibility through error tracking
- ✅ Security hardening through headers and rate limiting
- ✅ Authorization gaps closed

**Estimated Timeline**: 5-7 days  
**Confidence**: High  
**Risk**: Low (after completion)

**Status after P0**: 🟢 **PRODUCTION READY**
