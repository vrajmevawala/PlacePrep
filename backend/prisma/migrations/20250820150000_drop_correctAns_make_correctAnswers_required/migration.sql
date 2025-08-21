-- Backfill correctAnswers from correctAns if needed
UPDATE "public"."Question"
SET "correctAnswers" = to_jsonb(ARRAY["correctAns"])::jsonb
WHERE "correctAnswers" IS NULL AND "correctAns" IS NOT NULL;

-- Make correctAnswers required by setting default empty array then altering
ALTER TABLE "public"."Question"
  ALTER COLUMN "correctAnswers" SET DEFAULT '[]'::jsonb,
  ALTER COLUMN "correctAnswers" SET NOT NULL;

-- Drop legacy column
ALTER TABLE "public"."Question" DROP COLUMN IF EXISTS "correctAns";

