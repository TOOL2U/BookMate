/*
  Warnings:

  - A unique constraint covering the columns `[spreadsheet_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "spreadsheet_created_at" TIMESTAMP(3),
ADD COLUMN     "spreadsheet_id" TEXT,
ADD COLUMN     "spreadsheet_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_spreadsheet_id_key" ON "users"("spreadsheet_id");

-- CreateIndex
CREATE INDEX "users_spreadsheet_id_idx" ON "users"("spreadsheet_id");
