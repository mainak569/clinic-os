# Supabase Connection Pooler Configuration

## Understanding Supabase Poolers

Supabase provides **two types of connection poolers**:

### 1. Transaction Pooler (Port 6543)
- **Purpose**: For application queries (Prisma Client operations)
- **Mode**: Transaction mode
- **Limitations**: Doesn't support all PostgreSQL features (prepared statements, etc.)
- **Use for**: `DATABASE_URL` in Prisma

### 2. Session Pooler (Port 5432)
- **Purpose**: For migrations and schema changes (Prisma migrations)
- **Mode**: Session mode  
- **Features**: Full PostgreSQL feature support
- **Use for**: `DIRECT_URL` in Prisma

## Correct Configuration

### `.env` and `.env.local`

```env
# Transaction Pooler - For Prisma Client queries
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session Pooler - For Prisma migrations
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
```

### Your Specific Configuration

```env
# Transaction Pooler (Port 6543)
DATABASE_URL="postgresql://postgres.aczspvcunqsweytxcukr:FF%239rq9cvcvl@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session Pooler (Port 5432)
DIRECT_URL="postgresql://postgres.aczspvcunqsweytxcukr:FF%239rq9cvcvl@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
```

## Prisma Schema Configuration

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")      // Transaction Pooler
  directUrl = env("DIRECT_URL")        // Session Pooler
}
```

## How Prisma Uses These URLs

| Operation | Uses | Port | Pooler Type |
|-----------|------|------|-------------|
| `prisma generate` | - | - | None (local) |
| `prisma db push` | `DIRECT_URL` | 5432 | Session Pooler |
| `prisma migrate dev` | `DIRECT_URL` | 5432 | Session Pooler |
| `prisma migrate deploy` | `DIRECT_URL` | 5432 | Session Pooler |
| Application queries | `DATABASE_URL` | 6543 | Transaction Pooler |
| Prisma Client | `DATABASE_URL` | 6543 | Transaction Pooler |

## Key Points

✅ **Transaction Pooler (6543)**:
- Faster for many concurrent connections
- Used by your Next.js application
- Requires `?pgbouncer=true` parameter
- Limited PostgreSQL feature set

✅ **Session Pooler (5432)**:
- Full PostgreSQL feature support
- Used for migrations and schema changes
- Better for DDL operations
- Required for `db push` and migrations

## Getting Your URLs from Supabase

1. Go to Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Look for **Connection Pooling** section
4. You'll see two connection strings:
   - **Transaction mode** (port 6543)
   - **Session mode** (port 5432)

## Common Issues and Solutions

### Issue: `db push` hangs or times out
**Solution**: Verify `DIRECT_URL` uses Session Pooler (port 5432)

### Issue: Application queries fail with "prepared statement not supported"
**Solution**: Add `?pgbouncer=true` to `DATABASE_URL` (Transaction Pooler)

### Issue: Connection pool exhausted
**Solution**: Transaction Pooler handles this automatically

## Testing Your Configuration

```bash
# Validate schema
npx prisma validate

# Test connection and push schema
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed database
npm run db:seed
```

## Production Deployment

For production (e.g., Vercel):

1. Add both environment variables in deployment settings
2. Use the same Transaction/Session Pooler URLs
3. Never commit `.env` files to git

## Why Two Poolers?

Supabase uses PgBouncer for connection pooling:

- **Transaction Mode** (6543): Lightweight, fast, limited features
- **Session Mode** (5432): Full features, used for admin operations

Prisma needs both to work optimally with Supabase:
- Runtime queries → Transaction Pooler (fast)
- Schema changes → Session Pooler (full SQL support)