-- Add OAuth token fields to User table
ALTER TABLE "users" ADD COLUMN "google_access_token" TEXT;
ALTER TABLE "users" ADD COLUMN "google_refresh_token" TEXT;
ALTER TABLE "users" ADD COLUMN "google_token_expiry" TIMESTAMP(3);
