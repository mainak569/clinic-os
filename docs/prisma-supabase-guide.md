# Prisma + Supabase Setup Guide

## Important: Supabase Connection Methods

Supabase provides two connection types:
1. **Connection Pooling** (PORT 6543) - For application queries
2. **Direct Connection** (PORT 5432) - For migrations (may have restrictions)

## Recommended Approach for Supabase

### Use `prisma db push` instead of `prisma migrate dev`

Supabase often restricts direct connections (port 5432) for security. Use `db push` which works with the pooled connection:

```bash
# Push schema to database (recommended for Supabase)
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### Why `db push` over `migrate dev`?

- ✅ Works with connection pooling (port 6543)
- ✅ No need for direct database access (port 5432)  
- ✅ Simpler for development and prototyping
- ✅ Automatically generates Prisma client
- ✅ Perfect for Supabase's architecture

### When to use `migrate dev`?

Only use migrations if:
- You need version-controlled migration history
- You have direct database access enabled
- You're in a production environment with migration requirements

## Step-by-Step Setup

### 1. Verify Schema
```bash
npx prisma validate
```

### 2. Push Schema to Database
```bash
npx prisma db push
```

This will:
- Create all tables in your Supabase database
- Generate Prisma client
- Skip creating migration files

### 3. Seed the Database
```bash
npm run db:seed
```

### 4. Verify in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Tables**
3. You should see all tables created

### 5. Explore Data with Prisma Studio
```bash
npm run db:studio
```

Opens at `http://localhost:5555`

## Troubleshooting Direct Connection

If you need direct connection access:

### Option 1: Enable Direct Connection in Supabase
1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Check if direct connections are enabled
4. Some plans may restrict this

### Option 2: Use IPv6 (if IPv4 blocked)
Supabase may require IPv6 for direct connections on some plans.

### Option 3: Use Connection Pooling URL for Everything
Update `schema.prisma` to not require `directUrl`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Remove directUrl line
}
```

Then use `db push` exclusively.

## Environment Configuration

Your `.env` should look like:

```env
# Connection pooling (PORT 6543) - Works for db push
DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres"

# Direct connection (PORT 5432) - May be restricted
DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

AUTH_SECRET="your-secret"
AUTH_URL="http://localhost:3000"
```

## Recommended Workflow

### Development (Supabase)
```bash
# 1. Update schema.prisma
# 2. Push changes
npx prisma db push

# 3. Seed data
npm run db:seed

# 4. Verify with Studio
npm run db:studio
```

### Production Migrations (if needed later)
```bash
# Create migration files
npx prisma migrate dev --name description

# Apply to production
npx prisma migrate deploy
```

## Common Errors

### P1001: Can't reach database server
- **Solution**: Use `npx prisma db push` instead of `migrate dev`
- Direct connections may be restricted on your Supabase plan

### Connection timeout
- Verify `DATABASE_URL` in `.env`
- Check Supabase project is active
- Confirm password is URL-encoded

### SSL/TLS errors
Add `?sslmode=require` to connection string if needed

## Next Steps

After successful schema push:
1. ✅ Run seed script: `npm run db:seed`
2. ✅ Verify data in Prisma Studio
3. ✅ Start building API routes
4. ✅ Implement authentication

## Quick Reference

```bash
# Recommended Supabase commands
npx prisma db push              # Push schema (use this!)
npx prisma generate             # Generate client
npm run db:seed                 # Seed data
npm run db:studio               # View data

# Traditional migration commands (may not work with Supabase)
npx prisma migrate dev          # Create migration (needs direct access)
npx prisma migrate deploy       # Apply migrations (needs direct access)
```