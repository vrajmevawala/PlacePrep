-- Add optional multiple-selected answers array on activity
ALTER TABLE "public"."StudentActivity" ADD COLUMN IF NOT EXISTS "selectedAnswers" JSONB;

