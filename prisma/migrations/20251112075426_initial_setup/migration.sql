-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebase_uid" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT,
    "avatar_url" TEXT,
    "phone" TEXT,
    "password_hash" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "status" TEXT NOT NULL DEFAULT 'active',
    "role" TEXT NOT NULL DEFAULT 'user',
    "workspace_id" TEXT,
    "organization_id" TEXT,
    "last_login_at" TIMESTAMP(3),
    "last_login_ip" TEXT,
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "failed_login_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_templates" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "branding" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_reports" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3),
    "passcode" TEXT,
    "max_views" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed_at" TIMESTAMP(3),

    CONSTRAINT "shared_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_reports" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "template_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schedule_config" JSONB NOT NULL,
    "recipients" JSONB NOT NULL,
    "delivery_config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "next_run" TIMESTAMP(3),
    "last_run" TIMESTAMP(3),
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_delivery_logs" (
    "id" TEXT NOT NULL,
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
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "user_id" TEXT,
    "metadata" JSONB,

    CONSTRAINT "email_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_jobs" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL,
    "result" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "error" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_analytics" (
    "id" TEXT NOT NULL,
    "workspace_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "generation_time" INTEGER,
    "ai_tokens_used" INTEGER,
    "pdf_size" INTEGER,
    "user_id" TEXT,
    "template_id" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "report_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_firebase_uid_idx" ON "users"("firebase_uid");

-- CreateIndex
CREATE INDEX "users_workspace_id_idx" ON "users"("workspace_id");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_idx" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

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

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_delivery_logs" ADD CONSTRAINT "email_delivery_logs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "scheduled_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
