-- AlterTable
ALTER TABLE "Metrics" ADD COLUMN IF NOT EXISTS "routes" JSONB;
