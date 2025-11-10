-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "branding" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "shared_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "expires_at" DATETIME,
    "passcode" TEXT,
    "max_views" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" DATETIME
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "template_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schedule_config" JSONB NOT NULL,
    "recipients" JSONB NOT NULL,
    "delivery_config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "next_run" DATETIME,
    "last_run" DATETIME,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "email_delivery_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "report_name" TEXT NOT NULL,
    "report_period" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "email_provider" TEXT NOT NULL DEFAULT 'sendgrid',
    "message_id" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "pdf_size" INTEGER,
    "pdf_url" TEXT,
    "sent_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" DATETIME,
    "user_id" TEXT,
    "metadata" JSONB,
    CONSTRAINT "email_delivery_logs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "scheduled_reports" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "result" JSONB,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "duration" INTEGER,
    "error" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "report_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspace_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "generation_time" INTEGER,
    "ai_tokens_used" INTEGER,
    "pdf_size" INTEGER,
    "user_id" TEXT,
    "template_id" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB
);

-- CreateIndex
CREATE INDEX "report_templates_workspace_id_idx" ON "report_templates"("workspace_id");

-- CreateIndex
CREATE INDEX "report_templates_type_idx" ON "report_templates"("type");

-- CreateIndex
CREATE INDEX "report_templates_is_default_idx" ON "report_templates"("is_default");

-- CreateIndex
CREATE UNIQUE INDEX "shared_reports_token_key" ON "shared_reports"("token");

-- CreateIndex
CREATE INDEX "shared_reports_token_idx" ON "shared_reports"("token");

-- CreateIndex
CREATE INDEX "shared_reports_workspace_id_idx" ON "shared_reports"("workspace_id");

-- CreateIndex
CREATE INDEX "shared_reports_expires_at_idx" ON "shared_reports"("expires_at");

-- CreateIndex
CREATE INDEX "shared_reports_created_at_idx" ON "shared_reports"("created_at");

-- CreateIndex
CREATE INDEX "scheduled_reports_workspace_id_idx" ON "scheduled_reports"("workspace_id");

-- CreateIndex
CREATE INDEX "scheduled_reports_status_idx" ON "scheduled_reports"("status");

-- CreateIndex
CREATE INDEX "scheduled_reports_next_run_idx" ON "scheduled_reports"("next_run");

-- CreateIndex
CREATE INDEX "scheduled_reports_created_at_idx" ON "scheduled_reports"("created_at");

-- CreateIndex
CREATE INDEX "email_delivery_logs_workspace_id_idx" ON "email_delivery_logs"("workspace_id");

-- CreateIndex
CREATE INDEX "email_delivery_logs_schedule_id_idx" ON "email_delivery_logs"("schedule_id");

-- CreateIndex
CREATE INDEX "email_delivery_logs_status_idx" ON "email_delivery_logs"("status");

-- CreateIndex
CREATE INDEX "email_delivery_logs_sent_at_idx" ON "email_delivery_logs"("sent_at");

-- CreateIndex
CREATE INDEX "report_jobs_workspace_id_idx" ON "report_jobs"("workspace_id");

-- CreateIndex
CREATE INDEX "report_jobs_status_idx" ON "report_jobs"("status");

-- CreateIndex
CREATE INDEX "report_jobs_created_at_idx" ON "report_jobs"("created_at");

-- CreateIndex
CREATE INDEX "report_analytics_workspace_id_idx" ON "report_analytics"("workspace_id");

-- CreateIndex
CREATE INDEX "report_analytics_event_type_idx" ON "report_analytics"("event_type");

-- CreateIndex
CREATE INDEX "report_analytics_timestamp_idx" ON "report_analytics"("timestamp");
