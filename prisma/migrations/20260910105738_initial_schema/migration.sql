-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FRONT_DESK', 'PROVIDER');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('NEW_PATIENT', 'FOLLOW_UP', 'CONSULTATION', 'PROCEDURE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "HistoryAction" AS ENUM ('CREATED', 'UPDATED', 'CANCELLED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('APPOINTMENT_REMINDER', 'FOLLOW_UP_DUE', 'LAB_RESULTS', 'PRESCRIPTION_RENEWAL', 'SYSTEM_MESSAGE', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "AlertPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FRONT_DESK',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "title" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_profiles" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "specialization" TEXT,
    "license_number" TEXT,
    "phone" TEXT,
    "office_location" TEXT,
    "bio" TEXT,
    "appointment_length" INTEGER NOT NULL DEFAULT 30,
    "buffer_time" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "date_of_birth" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "insurance_provider" TEXT,
    "insurance_id" TEXT,
    "allergies" TEXT,
    "medications" TEXT,
    "medical_history" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_slots" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "day_of_week" "DayOfWeek" NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "type" "AppointmentType" NOT NULL DEFAULT 'FOLLOW_UP',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "notes" TEXT,
    "checked_in_at" TIMESTAMP(3),
    "checked_out_at" TIMESTAMP(3),
    "cost" DECIMAL(10,2),
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit_notes" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "chief_complaint" TEXT,
    "history_of_present" TEXT,
    "physical_exam" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "blood_pressure" TEXT,
    "heart_rate" INTEGER,
    "temperature" DECIMAL(4,1),
    "respiratory_rate" INTEGER,
    "oxygen_saturation" INTEGER,
    "weight" DECIMAL(5,2),
    "height" DECIMAL(5,2),
    "prescriptions" TEXT,
    "lab_orders" TEXT,
    "imaging_orders" TEXT,
    "referrals" TEXT,
    "follow_up_instructions" TEXT,
    "next_visit_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_history" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "action" "HistoryAction" NOT NULL,
    "previous_value" TEXT,
    "new_value" TEXT,
    "notes" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "provider_id" TEXT,
    "type" "AlertType" NOT NULL,
    "priority" "AlertPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_dismissed" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "providers_user_id_key" ON "providers"("user_id");

-- CreateIndex
CREATE INDEX "providers_user_id_idx" ON "providers"("user_id");

-- CreateIndex
CREATE INDEX "providers_first_name_last_name_idx" ON "providers"("first_name", "last_name");

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_provider_id_key" ON "provider_profiles"("provider_id");

-- CreateIndex
CREATE INDEX "provider_profiles_provider_id_idx" ON "provider_profiles"("provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "patients_email_key" ON "patients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_phone_key" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_email_idx" ON "patients"("email");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_first_name_last_name_idx" ON "patients"("first_name", "last_name");

-- CreateIndex
CREATE INDEX "patients_date_of_birth_idx" ON "patients"("date_of_birth");

-- CreateIndex
CREATE INDEX "availability_slots_provider_id_idx" ON "availability_slots"("provider_id");

-- CreateIndex
CREATE INDEX "availability_slots_day_of_week_idx" ON "availability_slots"("day_of_week");

-- CreateIndex
CREATE UNIQUE INDEX "availability_slots_provider_id_day_of_week_start_time_end_t_key" ON "availability_slots"("provider_id", "day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "appointments_patient_id_idx" ON "appointments"("patient_id");

-- CreateIndex
CREATE INDEX "appointments_provider_id_idx" ON "appointments"("provider_id");

-- CreateIndex
CREATE INDEX "appointments_scheduled_at_idx" ON "appointments"("scheduled_at");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_created_at_idx" ON "appointments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "visit_notes_appointment_id_key" ON "visit_notes"("appointment_id");

-- CreateIndex
CREATE INDEX "visit_notes_appointment_id_idx" ON "visit_notes"("appointment_id");

-- CreateIndex
CREATE INDEX "appointment_history_appointment_id_idx" ON "appointment_history"("appointment_id");

-- CreateIndex
CREATE INDEX "appointment_history_action_idx" ON "appointment_history"("action");

-- CreateIndex
CREATE INDEX "appointment_history_created_at_idx" ON "appointment_history"("created_at");

-- CreateIndex
CREATE INDEX "alerts_provider_id_idx" ON "alerts"("provider_id");

-- CreateIndex
CREATE INDEX "alerts_type_idx" ON "alerts"("type");

-- CreateIndex
CREATE INDEX "alerts_priority_idx" ON "alerts"("priority");

-- CreateIndex
CREATE INDEX "alerts_is_read_idx" ON "alerts"("is_read");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at");

-- AddForeignKey
ALTER TABLE "providers" ADD CONSTRAINT "providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_profiles" ADD CONSTRAINT "provider_profiles_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_slots" ADD CONSTRAINT "availability_slots_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_notes" ADD CONSTRAINT "visit_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_history" ADD CONSTRAINT "appointment_history_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
