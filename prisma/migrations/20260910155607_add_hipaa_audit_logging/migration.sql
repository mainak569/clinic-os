-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'PRINT', 'LOGIN', 'LOGOUT', 'ACCESS_DENIED');

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('APPOINTMENT', 'PATIENT', 'VISIT_NOTE', 'PROVIDER', 'USER', 'AVAILABILITY', 'ALERT');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "resource" "ResourceType" NOT NULL,
    "resource_id" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
