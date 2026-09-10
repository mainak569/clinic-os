# ClinicOS Project Specification


## Project Overview

Build a production-grade clinic appointment scheduling system.

The application manages:

- clinic staff
- healthcare providers
- patients
- availability slots
- appointments
- visit notes
- appointment history
- alerts
- analytics


## Problem Statement

Small clinics often manage appointments manually using paper schedules and shared calendars.

This creates problems:

- double bookings
- unused provider availability
- missed appointments
- poor visibility into clinic operations

ClinicOS solves this by providing a centralized scheduling and management platform.


# Technology Stack


## Frontend

Use:

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Recharts
- FullCalendar


## Backend

Use:

- Next.js server architecture
- Server Actions
- API routes where appropriate


## Authentication

Use:

- Auth.js
- Credentials Provider
- bcrypt password hashing
- JWT sessions


## Database

Use:

- PostgreSQL
- Supabase
- Prisma ORM


## Deployment

Use:

- Vercel


# Engineering Rules

Follow these rules:

1. Write production-quality code.

2. Do not create fake or placeholder functionality.

3. Business rules must be enforced server-side.

4. Never trust frontend-only authorization.

5. Use TypeScript strictly.

6. Validate all user input.

7. Separate UI, business logic, and database logic.

8. Handle errors properly.

9. Write clean maintainable code.

10. Explain important architectural decisions.


# User Roles


## Front Desk

Permissions:

- create availability slots
- edit availability
- archive availability
- restore availability
- confirm appointments
- cancel appointments
- reassign appointments
- view alerts
- export schedules


## Provider

Permissions:

- view own schedule
- manage own visit notes
- update allowed appointment information


Restrictions:

Provider cannot:

- create slots for another provider
- view another provider schedule
- reassign appointments away from themselves


Authorization must be enforced on backend.


# Appointment Workflow


Appointment lifecycle:

REQUESTED

↓

CONFIRMED

↓

CHECKED_IN

↓

COMPLETED


NO_SHOW:

Allowed only from CONFIRMED.

Allowed only after scheduled time has passed.


Cancellation:

Allowed only before CHECKED_IN.

Cancellation requires a reason.


# Required Features


## Authentication

Email/password login.

Minimum roles:

- FRONT_DESK
- PROVIDER


## Availability

Users can:

- create slots
- edit unbooked slots
- archive slots
- restore slots


## Appointments

Support:

- booking
- confirmation
- check-in
- completion
- cancellation
- no-show


## Visit Notes

Providers can:

- create notes
- edit their own notes


## Care Team

Appointments support:

- one main provider
- multiple supporting providers


## Search

Appointments must support:

- patient name search
- provider filter
- status filter
- date filter
- sorting
- pagination

Filtering must happen server-side.


## Bulk Availability

Support:

- recurring slot generation
- collision detection
- CSV export


## Dashboard

Include:

- today's appointments
- current check-ins
- weekly no-shows
- upcoming confirmed appointments
- provider breakdown
- status breakdown
- no-show analytics


## History

Maintain immutable timeline:

- status changes
- cancellations
- supporting provider changes
- visit notes


## Alerts

Requested appointments within 24 hours:

show alerts.

If still unconfirmed 1 hour before:

alert must reappear even after dismissal.


# Development Process

For every feature:

1. Explain implementation approach.
2. Implement.
3. Test.
4. Review.
5. Commit.


Create meaningful git commits after every major milestone.


# Code Quality

Application should include:

- responsive UI
- loading states
- empty states
- error handling
- accessibility
- clean UX