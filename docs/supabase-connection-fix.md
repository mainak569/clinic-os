# Supabase Connection Troubleshooting

## Issue: `npx prisma db push` hangs or times out

This is a common issue with Supabase's connection pooling and Prisma.

## Solutions (Try in order)

### Solution 1: Add PgBouncer Parameters ✅

Update your `.env` and `.env.local` with these parameters:

```env
DATABASE_URL="postgresql://postgres.aczspvcunqsweytxcukr:FF%239rq9cvcvl@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

The parameters:
- `?pgbouncer=true` - Tells Prisma to work with PgBouncer
- `&connection_limit=1` - Limits connections for `db push`

### Solution 2: Use Transaction Mode Connection

Some Supabase projects require transaction mode:

```env
DATABASE_URL="postgresql://postgres.aczspvcunqsweytxcukr:FF%239rq9cvcvl@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&pool_timeout=0"
```

### Solution 3: Use Supabase Direct Connection (if available)

Check if you can enable IPv6 or direct connections in Supabase:

1. Go to Supabase Dashboard → Settings → Database
2. Look for "Direct Connection" or "Connection Pooling Mode"
3. If available, try switching modes

### Solution 4: Manual Table Creation via Supabase

If `db push` continues to hang, create tables manually:

1. **Copy the schema SQL**:
```bash
npx prisma migrate dev --create-only --name init
```

2. **Find the SQL** in `prisma/migrations/[timestamp]_init/migration.sql`

3. **Run in Supabase**:
   - Go to Supabase Dashboard → SQL Editor
   - Paste the migration SQL
   - Execute

4. **Generate Prisma Client**:
```bash
npx prisma generate
```

### Solution 5: Alternative Prisma Commands

Try these alternative approaches:

```bash
# Try with explicit accept data loss
npx prisma db push --accept-data-loss --skip-generate

# Then generate client separately
npx prisma generate

# Or use migrate dev with force flag
npx prisma migrate dev --name init --skip-seed
```

## Testing Connection

Test your connection string separately:

```bash
npx tsx test-db-connection.ts
```

Expected output:
```
✅ Successfully connected to database!
✅ Query test successful
✅ Disconnected successfully
```

## Recommended Workflow for Supabase

### Option A: Use Supabase SQL Editor (Recommended)

1. Generate migration file locally:
```bash
npx prisma migrate dev --create-only --name init
```

2. Copy SQL from `prisma/migrations/[timestamp]_init/migration.sql`

3. Run in Supabase Dashboard → SQL Editor

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Seed the database:
```bash
npm run db:seed
```

### Option B: Keep Trying db push

```bash
# Remove all node_modules and regenerate
rm -rf node_modules package-lock.json
npm install

# Try push again
npx prisma db push --accept-data-loss
```

## Environment Variables Reference

### For PgBouncer (Connection Pooling) - Required
```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
```

### For Direct Connection (if available) - Optional
```env
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
```

## Common Errors

### Error: Connection timeout
**Cause**: PgBouncer configuration issue
**Solution**: Add `?pgbouncer=true&connection_limit=1` to URL

### Error: P1001 Can't reach database
**Cause**: Direct connection (port 5432) is blocked
**Solution**: Remove `directUrl` from schema.prisma (already done)

### Error: Prepared statements not supported
**Cause**: PgBouncer transaction mode
**Solution**: Add `?pgbouncer=true` parameter

## Next Steps

Once connection works:

1. ✅ Push schema: `npx prisma db push`
2. ✅ Generate client: `npx prisma generate`  
3. ✅ Seed data: `npm run db:seed`
4. ✅ Verify in Supabase Dashboard
5. ✅ Test with Prisma Studio: `npm run db:studio`

## Still Having Issues?

Try running the push command manually with verbose logging:

```bash
DEBUG="*" npx prisma db push --accept-data-loss
```

Or contact me with the error output for further assistance!