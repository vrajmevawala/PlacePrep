-- AlterTable
ALTER TABLE "public"."Participation" ADD COLUMN IF NOT EXISTS "violations" INTEGER NOT NULL DEFAULT 0;
