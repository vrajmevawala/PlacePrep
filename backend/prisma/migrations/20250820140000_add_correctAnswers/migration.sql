-- Add optional multiple-correct answers column
ALTER TABLE "public"."Question" ADD COLUMN IF NOT EXISTS "correctAnswers" JSONB;

