# Environment Variables Setup Checklist

This checklist ensures all required environment variables are configured before deploying ClinicOS to production.

---

## ✅ Pre-Deployment Checklist

### 1. Database Setup (Supabase)

- [ ] Created Supabase project
- [ ] Copied **Transaction Pooler URL** (port 6543)
- [ ] Copied **Session Pooler URL** (port 5432)
- [ ] Tested database connection
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seeded initial data: `npm run db:seed`

**URLs Format**:
```
Transaction: postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true
Session: postgresql://postgres.xxx:[PASSWORD]@xxx.pooler.supabase.com:5432/postgres
```

---

### 2. Error Tracking (Sentry)

- [ ] Created Sentry account
- [ ] Created new Next.js project
- [ ] Copied **DSN** URL
- [ ] Tested error capture
- [ ] Configured alert rules (optional)

**DSN Format**:
```
https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]
```

---

### 3. Authentication Secrets

- [ ] Generated **AUTH_SECRET** (32+ bytes)
- [ ] Generated **CRON_SECRET** (32+ bytes)
- [ ] Saved secrets securely
- [ ] Never committed secrets to git

**Generate Secrets**:
```bash
# AUTH_SECRET
openssl rand -base64 32

# CRON_SECRET  
openssl rand -base64 32
```

---

### 4. Deployment URL

- [ ] Determined deployment URL
- [ ] For Vercel: Will be `https://[project-name].vercel.app`
- [ ] For custom domain: Updated DNS records
- [ ] Verified HTTPS works

---

## 📋 Environment Variables

### Required Variables (Production)

Copy this template and fill in your values:

```bash
# ============================================================================
# DATABASE (Supabase)
# ============================================================================
DATABASE_URL="postgresql://postgres.xxx:[YOUR_PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[YOUR_PASSWORD]@xxx.pooler.supabase.com:5432/postgres"

# ============================================================================
# AUTHENTICATION
# ============================================================================
AUTH_SECRET="[PASTE_YOUR_GENERATED_SECRET_HERE]"
AUTH_URL="https://[your-deployment-url].com"

# ============================================================================
# ERROR TRACKING
# ============================================================================
SENTRY_DSN="https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]"
NEXT_PUBLIC_SENTRY_DSN="https://[KEY]@[ORG].ingest.sentry.io/[PROJECT_ID]"

# ============================================================================
# CRON JOBS
# ============================================================================
CRON_SECRET="[PASTE_YOUR_GENERATED_SECRET_HERE]"

# ============================================================================
# FEATURE FLAGS
# ============================================================================
ENABLE_AUDIT_LOGGING="true"
ENABLE_RATE_LIMITING="true"
ENABLE_ERROR_TRACKING="true"

# ============================================================================
# ENVIRONMENT
# ============================================================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://[your-deployment-url].com"
```

---

## 🔍 Verification Steps

### Step 1: Local Verification

Before deploying, test locally with production-like settings:

```bash
# 1. Create .env.production.local
cp .env.example.production .env.production.local

# 2. Fill in all values (use your production credentials)

# 3. Build with production env
npm run build

# 4. Start production server locally
npm run start

# 5. Test at http://localhost:3000
# - Login works
# - Dashboard loads
# - Can create appointment
# - No console errors
```

### Step 2: Environment Variable Check

- [ ] All 11 required variables are set
- [ ] No placeholder values remain (e.g., "your-secret-here")
- [ ] URLs don't have trailing slashes
- [ ] Secrets are properly generated (not weak passwords)
- [ ] Database URLs include correct ports

### Step 3: Security Check

- [ ] `.env.production.local` is in `.gitignore`
- [ ] No secrets in git history
- [ ] Secrets stored securely (password manager)
- [ ] Team members have access to secrets (secure share)

---

## 🚀 Deployment Platform Setup

### For Vercel Deployment

1. **Go to**: https://vercel.com/new
2. **Import**: Your Git repository
3. **Settings** → **Environment Variables**
4. **Add each variable**:
   - Click "Add"
   - Name: `DATABASE_URL`
   - Value: `[paste your value]`
   - Environment: Select "Production"
   - Click "Add"
5. **Repeat** for all 11 variables
6. **Deploy**

**Verification**:
- [ ] All 11 variables show in Vercel dashboard
- [ ] All are set for "Production" environment
- [ ] No typos in variable names
- [ ] Values are correct (double-check)

### For Self-Hosted Deployment

1. **Create** `.env.production` on server:
   ```bash
   sudo nano /path/to/clinicos/.env.production
   ```

2. **Paste** all environment variables

3. **Set permissions**:
   ```bash
   chmod 600 .env.production
   chown [app-user]:[app-group] .env.production
   ```

4. **Verify** variables loaded:
   ```bash
   node -e "require('dotenv').config({path:'.env.production'}); console.log(process.env.DATABASE_URL ? 'Loaded' : 'Failed')"
   ```

---

## 🧪 Post-Deployment Testing

After deployment, verify environment variables work:

### Test 1: Database Connection

```bash
# SSH into server or use Vercel CLI
vercel env pull

# Test connection
npx prisma db pull
# Should succeed without errors
```

Expected: ✅ "Prisma schema loaded from prisma/schema.prisma"

### Test 2: Authentication

1. Visit `https://[your-domain].com/login`
2. Use demo credentials
3. Should redirect to dashboard

Expected: ✅ Successful login, no errors

### Test 3: Error Tracking

1. Visit Sentry dashboard
2. Trigger test error (invalid login)
3. Check if error appears

Expected: ✅ Error logged in Sentry

### Test 4: Cron Job

1. Visit Vercel dashboard → Cron Jobs
2. Check execution logs
3. Verify runs every 15 minutes

Expected: ✅ Job executes successfully

### Test 5: Security Headers

```bash
curl -I https://[your-domain].com
```

Expected headers:
```
x-frame-options: DENY
x-content-type-options: nosniff
strict-transport-security: max-age=63072000
```

### Test 6: Rate Limiting

```bash
for i in {1..105}; do curl -s -o /dev/null -w "%{http_code}\n" https://[your-domain].com; done
```

Expected: ✅ Returns 429 after 100 requests

---

## ❌ Common Mistakes

### Mistake 1: Wrong Database URL
**Problem**: Using Session URL for DATABASE_URL  
**Fix**: DATABASE_URL should use port 6543 (Transaction Pooler)

### Mistake 2: Trailing Slashes
**Problem**: `AUTH_URL="https://domain.com/"`  
**Fix**: Remove trailing slash: `AUTH_URL="https://domain.com"`

### Mistake 3: Weak Secrets
**Problem**: Using simple passwords like "mysecret123"  
**Fix**: Use `openssl rand -base64 32` to generate strong secrets

### Mistake 4: Missing Public Variables
**Problem**: Only set `SENTRY_DSN`, forgot `NEXT_PUBLIC_SENTRY_DSN`  
**Fix**: Both are required (server and client)

### Mistake 5: Development URLs in Production
**Problem**: `AUTH_URL="http://localhost:3000"` in production  
**Fix**: Update to production URL: `AUTH_URL="https://your-domain.com"`

---

## 🔐 Security Best Practices

### Secret Management

✅ **DO**:
- Use password manager for secrets
- Generate strong random secrets
- Use different secrets for dev/staging/prod
- Rotate secrets regularly (every 90 days)
- Share secrets via secure channels

❌ **DON'T**:
- Commit secrets to git
- Share secrets via email/Slack
- Reuse secrets across environments
- Use predictable secrets
- Store secrets in plain text files

### Environment Isolation

- **Development**: Use `.env.local` (gitignored)
- **Staging**: Use separate Supabase project
- **Production**: Use separate Supabase project + different secrets

---

## 📞 Support

If you encounter issues:

1. **Check**: Variable names for typos
2. **Verify**: Values are correct (no placeholders)
3. **Test**: Locally before deploying
4. **Review**: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
5. **Debug**: Check deployment logs

**Common Issues**:
- `DATABASE_URL` not set → Check Vercel env vars
- JWT errors → Verify `AUTH_SECRET` is set
- Redirect loops → Check `AUTH_URL` matches deployment URL
- Sentry not logging → Verify both DSN variables are set

---

## ✅ Final Checklist

Before marking "DONE":

- [ ] All 11 environment variables configured
- [ ] Tested locally with production values
- [ ] No secrets in git repository
- [ ] Secrets stored securely
- [ ] Team has access to secrets
- [ ] Variables set in deployment platform
- [ ] Build succeeded
- [ ] All post-deployment tests passed
- [ ] Error tracking working
- [ ] Cron jobs executing
- [ ] Security headers present
- [ ] Rate limiting working

---

**Status**: Once all items checked, you're ready to deploy! 🚀

**Next Step**: Follow [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for deployment.
