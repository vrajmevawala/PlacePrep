-- DropForeignKey
ALTER TABLE "StudentActivity" DROP CONSTRAINT "StudentActivity_freePracticeId_fkey";

-- DropForeignKey
ALTER TABLE "StudentActivity" DROP CONSTRAINT "StudentActivity_qid_fkey";

-- AddForeignKey
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_freePracticeId_fkey" FOREIGN KEY ("freePracticeId") REFERENCES "freePractice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_qid_fkey" FOREIGN KEY ("qid") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
