# Authentication Quick Start

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- `next-auth@5.0.0-beta.4` - Authentication framework
- `bcryptjs` - Password hashing
- All other dependencies

### Step 2: Verify Environment Variables

Check that `.env` and `.env.local` contain:

```env
# Database (already configured)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentication (already set)
AUTH_SECRET="JF7pk6cFOy/Bsj9cpiUHOymdy/0rXWSqyy5uxpfpexo="
AUTH_URL="http://localhost:3000"
```

### Step 3: Generate Prisma Client

```bash
npm run db:generate
```

### Step 4: Seed Database (if not done)

```bash
npm run db:seed
```

This creates:
- 3 users (2 providers + 1 front desk)
- Demo appointments and patients
- Sample data for testing

### Step 5: Start Development Server

```bash
npm run dev
```

### Step 6: Test Authentication

1. **Open browser**: http://localhost:3000/login

2. **Login as Provider**:
   ```
   Email: dr.smith@clinicos.com
   Password: DrSmith123!
   ```

3. **See Dashboard**: Should redirect to `/dashboard`

4. **Test Logout**: Click "Sign Out" button

5. **Login as Front Desk**:
   ```
   Email: frontdesk@clinicos.com
   Password: FrontDesk123!
   ```

## ✅ Verify Installation

### Check 1: Login Page Loads
- Visit: http://localhost:3000/login
- Should see professional login form

### Check 2: Protected Routes Work
- Try visiting: http://localhost:3000/dashboard (without login)
- Should redirect to login page

### Check 3: Authentication Works
- Login with demo credentials
- Should see dashboard with user info

### Check 4: Authorization Works
- Login as provider
- Visit: http://localhost:3000/api/appointments
- Should only see provider's own appointments

### Check 5: Logout Works
- Click "Sign Out"
- Try accessing dashboard
- Should redirect to login

## 🎯 What You Can Test

### As PROVIDER (dr.smith@clinicos.com)
✅ View own appointments
✅ View own profile
✅ Update own information
❌ Cannot access other providers' data
❌ Cannot access all patients

### As FRONT_DESK (frontdesk@clinicos.com)
✅ View all appointments
✅ View all patients
✅ View all providers
✅ Manage system data
✅ Full administrative access

## 📁 Key Files Reference

### Backend
- `auth.config.ts` - Auth configuration
- `auth.ts` - NextAuth instance
- `middleware.ts` - Route protection
- `lib/auth-helpers.ts` - Authorization functions

### Frontend
- `app/login/page.tsx` - Login page
- `app/dashboard/page.tsx` - Protected dashboard
- `components/auth/login-form.tsx` - Login form

### API
- `app/api/auth/[...nextauth]/route.ts` - Auth endpoints
- `app/api/appointments/route.ts` - Protected API example
- `app/api/providers/[providerId]/route.ts` - Authorization example

## 🔧 Common Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run start              # Start production server

# Database
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema changes
npm run db:seed            # Seed demo data
npm run db:studio          # Open database GUI

# Code Quality
npm run lint               # Run ESLint
npm run type-check         # Check TypeScript
npm run format             # Format code
```

## 🐛 Troubleshooting

### Problem: "Module not found: next-auth"
**Solution**: 
```bash
npm install
```

### Problem: "Invalid session"
**Solution**: 
```bash
# Verify AUTH_SECRET is set
echo $AUTH_SECRET
# If empty, check .env file
```

### Problem: Login fails with "Database error"
**Solution**:
```bash
# Verify database connection
npm run db:studio
# If fails, check DATABASE_URL in .env
```

### Problem: "Unauthorized" when accessing own data
**Solution**:
```bash
# Re-seed database to ensure providerId is linked
npm run db:seed
```

### Problem: Redirect loop
**Solution**:
- Check `middleware.ts` matcher
- Verify public routes configuration
- Clear browser cookies

## 📚 Next Steps

### 1. Explore Documentation
- [Authentication System](./authentication-system.md) - Complete guide
- [Testing Guide](./auth-testing-guide.md) - Test all features
- [Implementation Summary](./auth-implementation-summary.md) - Quick reference

### 2. Try Authorization Features
```typescript
// In Server Component
import { requireAuth, requireRole } from '@/lib/auth-helpers';

export default async function Page() {
  const session = await requireAuth();
  // User is authenticated
}
```

### 3. Build Protected Features
- Create appointment management UI
- Build patient records interface
- Add provider schedule management
- Implement role-based menus

### 4. Test API Routes
```bash
# Test appointments API (Provider)
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"dr.smith@clinicos.com","password":"DrSmith123!"}' \
  -c cookies.txt

curl -b cookies.txt http://localhost:3000/api/appointments
```

## 🔒 Security Checklist

Before going to production:

- [ ] Strong AUTH_SECRET (32+ bytes random)
- [ ] HTTPS enabled
- [ ] Secure cookies configured
- [ ] Rate limiting on login endpoint
- [ ] Password complexity enforced
- [ ] Session timeout configured
- [ ] Audit logging enabled
- [ ] Error messages don't leak info

## 💡 Tips

1. **Use Server Components**: Prefer Server Components with `requireAuth()` over Client Components

2. **Backend Authorization**: Always validate on server, never trust frontend

3. **Provider Isolation**: Use `canAccessProviderData()` for all provider-specific data

4. **Error Handling**: Catch authorization errors and show appropriate messages

5. **Testing**: Test with both PROVIDER and FRONT_DESK accounts

## 🎓 Learn More

- [Auth.js Docs](https://authjs.dev)
- [NextAuth v5 Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Next.js Authentication](https://nextjs.org/docs/app/building-your-application/authentication)
- [Prisma with Auth.js](https://authjs.dev/reference/adapter/prisma)

## 🤝 Need Help?

Common questions:
- How do I add a new user? → Update seed script
- How do I change password? → Implement password reset (future feature)
- How do I add MFA? → Future enhancement
- How do I test authorization? → See testing guide

The authentication system is fully implemented and ready to use! 🎉