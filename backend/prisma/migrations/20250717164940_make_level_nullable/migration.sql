-- AlterTable
ALTER TABLE "Participation" ALTER COLUMN "endTime" DROP NOT NULL;

-- AlterTable
ALTER TABLE "StudentActivity" ADD COLUMN     "freePracticeId" INTEGER,
ADD COLUMN     "selectedAnswer" VARCHAR(255),
ADD COLUMN     "testSeriesId" INTEGER;

-- AlterTable
ALTER TABLE "TestSeries" ADD COLUMN     "level" "Level";

-- AlterTable
ALTER TABLE "freePractice" ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "level" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_freePracticeId_fkey" FOREIGN KEY ("freePracticeId") REFERENCES "freePractice"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_testSeriesId_fkey" FOREIGN KEY ("testSeriesId") REFERENCES "TestSeries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
