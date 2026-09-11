/*
  Warnings:

  - You are about to drop the column `created_at` on the `appointment_history` table. All the data in the column will be lost.
  - Made the column `performed_by` on table `appointment_history` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `author_id` to the `visit_notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "HistoryAction" ADD VALUE 'PROVIDER_CHANGED';
ALTER TYPE "HistoryAction" ADD VALUE 'SUPPORTING_PROVIDER_ADDED';
ALTER TYPE "HistoryAction" ADD VALUE 'SUPPORTING_PROVIDER_REMOVED';
ALTER TYPE "HistoryAction" ADD VALUE 'NOTE_ADDED';
ALTER TYPE "HistoryAction" ADD VALUE 'NOTE_UPDATED';

-- DropIndex
DROP INDEX "appointment_history_created_at_idx";

-- AlterTable
-- Migrate appointment history - handle existing NULL performed_by values
UPDATE "appointment_history"
SET "performed_by" = (
  SELECT "user_id" FROM "providers" LIMIT 1
)
WHERE "performed_by" IS NULL;

ALTER TABLE "appointment_history" DROP COLUMN "created_at",
ADD COLUMN     "field" TEXT,
ADD COLUMN     "metadata" TEXT,
ADD COLUMN     "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "performed_by" SET NOT NULL;

-- AlterTable
-- First add the columns as nullable
ALTER TABLE "visit_notes" ADD COLUMN     "author_id" TEXT,
ADD COLUMN     "last_edited_at" TIMESTAMP(3),
ADD COLUMN     "last_edited_by" TEXT;

-- Migrate existing data: Set author_id to the appointment's provider's user_id
UPDATE "visit_notes" vn
SET "author_id" = (
  SELECT p."user_id"
  FROM "appointments" a
  JOIN "providers" p ON p."id" = a."provider_id"
  WHERE a."id" = vn."appointment_id"
)
WHERE "author_id" IS NULL;

-- Set last_edited_by to author_id for existing records
UPDATE "visit_notes"
SET "last_edited_by" = "author_id",
    "last_edited_at" = "created_at"
WHERE "last_edited_by" IS NULL;

-- Now make author_id NOT NULL
ALTER TABLE "visit_notes" ALTER COLUMN "author_id" SET NOT NULL;

-- CreateTable
CREATE TABLE "visit_note_history" (
    "id" TEXT NOT NULL,
    "visit_note_id" TEXT NOT NULL,
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
    "edited_by" TEXT NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_reason" TEXT,

    CONSTRAINT "visit_note_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "visit_note_history_visit_note_id_idx" ON "visit_note_history"("visit_note_id");

-- CreateIndex
CREATE INDEX "visit_note_history_edited_at_idx" ON "visit_note_history"("edited_at");

-- CreateIndex
CREATE INDEX "appointment_history_performed_at_idx" ON "appointment_history"("performed_at");

-- CreateIndex
CREATE INDEX "appointment_history_performed_by_idx" ON "appointment_history"("performed_by");

-- CreateIndex
CREATE INDEX "visit_notes_author_id_idx" ON "visit_notes"("author_id");

-- CreateIndex
CREATE INDEX "visit_notes_created_at_idx" ON "visit_notes"("created_at");

-- AddForeignKey
ALTER TABLE "visit_notes" ADD CONSTRAINT "visit_notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_notes" ADD CONSTRAINT "visit_notes_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_note_history" ADD CONSTRAINT "visit_note_history_visit_note_id_fkey" FOREIGN KEY ("visit_note_id") REFERENCES "visit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visit_note_history" ADD CONSTRAINT "visit_note_history_edited_by_fkey" FOREIGN KEY ("edited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_history" ADD CONSTRAINT "appointment_history_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
