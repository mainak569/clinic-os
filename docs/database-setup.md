# Database Setup Guide

This guide walks you through setting up the ClinicOS database with Prisma and Supabase.

## Prerequisites

- Supabase account and project
- Node.js 18+ installed
- Project dependencies installed (`npm install`)

## 1. Supabase Setup

### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Choose a region close to your users
4. Set a strong database password

### Get Database Connection Strings
1. Navigate to **Settings** > **Database** in your Supabase dashboard
2. Copy the **Connection pooling** URL for `DATABASE_URL`
3. Copy the **Direct connection** URL for `DIRECT_URL`
4. Replace `[YOUR-PASSWORD]` with your actual database password

## 2. Environment Configuration

### Create Environment File
```bash
cp .env.example .env.local
```

### Update Environment Variables
Edit `.env.local` with your Supabase credentials:

```env
DATABASE_URL="postgresql://postgres.your-ref:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?schema=public"
DIRECT_URL="postgresql://postgres.your-ref:[YOUR-PASSWORD]@aws-0-us-east-1.compute-1.amazonaws.com:5432/postgres?schema=public"
AUTH_SECRET="your-generated-secret-key"
AUTH_URL="http://localhost:3000"
```

### Generate AUTH_SECRET
```bash
openssl rand -base64 32
```

## 3. Database Migration

### Generate Prisma Client
```bash
npm run db:generate
```

### Push Schema to Database
```bash
npm run db:push
```

### Seed Sample Data
```bash
npm run db:seed
```

## 4. Verification

### Check Database
1. Open Supabase dashboard
2. Navigate to **Database** > **Tables**
3. Verify all tables are created

### Access Prisma Studio
```bash
npm run db:studio
```
This opens a web interface to browse your data at `http://localhost:5555`

## 5. Sample Data Overview

The seed script creates:

### Users (3)
- **Front Desk**: `frontdesk@clinicos.com` / `FrontDesk123!`
- **Dr. Smith**: `dr.smith@clinicos.com` / `DrSmith123!`
- **Dr. Johnson**: `dr.johnson@clinicos.com` / `DrJohnson123!`

### Providers (2)
- **Dr. Sarah Smith**: Family Medicine, Room 101
- **Dr. Michael Johnson**: Internal Medicine, Room 102

### Patients (5)
- John Davis, Mary Wilson, Robert Brown, Emily Chen, James Garcia

### Appointments (5)
- Various statuses: Confirmed, Checked-in, Requested
- Different appointment types: Follow-up, New Patient, Consultation

### Additional Data
- Availability slots for both providers
- Sample visit notes
- System alerts

## 6. Database Commands Reference

```bash
# Development
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:seed        # Seed sample data
npm run db:studio      # Open Prisma Studio

# Production
npm run db:migrate     # Create and run migrations
npm run db:reset       # Reset database and reseed
```

## 7. Schema Overview

### Core Tables
- `users` - Authentication and user management
- `providers` - Healthcare providers
- `provider_profiles` - Extended provider information
- `patients` - Patient demographics and medical info
- `appointments` - Appointment scheduling
- `availability_slots` - Provider availability

### Clinical Tables
- `visit_notes` - Clinical documentation
- `appointment_history` - Audit trail
- `alerts` - Notifications and reminders

### Key Features
- **HIPAA Compliance**: Sensitive data isolation
- **Audit Trails**: Full appointment history
- **Soft Deletes**: Data recovery capability
- **Performance**: Strategic indexing
- **Scalability**: Normalized schema design

## 8. Security Considerations

### Row Level Security (RLS)
Supabase RLS policies should be configured for:
- Users can only access their own data
- Providers can only see their patients/appointments
- Front desk has broader access for scheduling

### Data Encryption
- All sensitive fields are encrypted at rest
- Database connections use SSL
- Environment variables for credentials

## 9. Troubleshooting

### Common Issues

**Connection Refused**
- Verify DATABASE_URL and DIRECT_URL
- Check Supabase project is running
- Confirm password is correct

**Migration Errors**
- Reset database: `npm run db:reset`
- Check schema syntax
- Verify Prisma version compatibility

**Seed Failures**
- Clear existing data before reseeding
- Check foreign key constraints
- Verify enum values match schema

### Debug Commands
```bash
# Check Prisma version
npx prisma --version

# Validate schema
npx prisma validate

# View database connection
npx prisma db pull --print
```

## 10. Next Steps

After successful setup:
1. Implement authentication with Auth.js
2. Create API routes for CRUD operations
3. Build the appointment scheduling UI
4. Add role-based access controls
5. Implement real-time notifications

For development, use `npm run db:studio` to visually inspect and manage your data.