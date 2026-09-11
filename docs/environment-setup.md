# Environment Setup

ClinicOS uses different environment files for different purposes:

## Environment Files

### `.env` (Prisma CLI)
- Used by Prisma CLI commands (`prisma migrate`, `prisma generate`, etc.)
- Required for database operations
- Should contain database credentials

### `.env.local` (Next.js)
- Used by Next.js application at runtime
- Loaded automatically by Next.js
- Should contain the same values as `.env` plus any Next.js-specific variables

## Setup Instructions

### 1. Copy the example file
```bash
cp .env.example .env.local
```

### 2. Fill in your Supabase credentials in `.env.local`
```env
DATABASE_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.your-ref.supabase.co:5432/postgres"
AUTH_SECRET="your-generated-secret"
AUTH_URL="http://localhost:3000"
```

### 3. Copy `.env.local` to `.env` for Prisma
```bash
cp .env.local .env
```

## Why Two Files?

- **Prisma CLI** looks for `.env` by default
- **Next.js** looks for `.env.local` in development
- Both files are in `.gitignore` for security
- Both should contain the same database credentials

## Important Notes

- **Never commit** `.env` or `.env.local` to version control
- Both files are ignored by git (check `.gitignore`)
- Keep both files in sync when updating credentials
- Generate `AUTH_SECRET` with: `openssl rand -base64 32`

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | Connection pooling URL | For application queries |
| `DIRECT_URL` | Direct database URL | For Prisma migrations |
| `AUTH_SECRET` | JWT signing secret | For session encryption |
| `AUTH_URL` | Application base URL | For OAuth callbacks |

## Testing Environment Setup

```bash
# Test database connection
npx prisma db pull

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

## Troubleshooting

### Error: Environment variable not found
- Make sure `.env` exists for Prisma commands
- Make sure `.env.local` exists for Next.js runtime
- Verify variable names match exactly

### Connection refused
- Check Supabase project is running
- Verify database URL format
- Confirm password is URL-encoded (use `%23` for `#`, etc.)

### URL Encoding Special Characters
If your password contains special characters, encode them:
- `#` → `%23`
- `@` → `%40`
- `$` → `%24`
- `&` → `%26`
- `+` → `%2B`

## Production Deployment

For production (e.g., Vercel):
1. Add environment variables in the deployment platform dashboard
2. Use the same variable names
3. Don't commit any `.env` files
4. Use production database credentials