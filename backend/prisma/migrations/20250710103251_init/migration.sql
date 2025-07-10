-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Aptitude', 'Technical');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('easy', 'medium', 'hard');

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "category" "Category" NOT NULL,
    "subcategory" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAns" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "visibility" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestSeries" (
    "id" SERIAL NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freePractice" (
    "id" SERIAL NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freePractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participation" (
    "pid" SERIAL NOT NULL,
    "sid" INTEGER NOT NULL,
    "practiceTest" BOOLEAN NOT NULL,
    "contest" BOOLEAN NOT NULL,
    "testSeriesId" INTEGER,
    "freePracticeId" INTEGER,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participation_pkey" PRIMARY KEY ("pid")
);

-- CreateTable
CREATE TABLE "StudentActivity" (
    "aid" SERIAL NOT NULL,
    "sid" INTEGER NOT NULL,
    "qid" INTEGER NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentActivity_pkey" PRIMARY KEY ("aid")
);

-- CreateTable
CREATE TABLE "_TestSeriesQuestions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TestSeriesQuestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FreePracticeQuestions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_FreePracticeQuestions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TestSeriesQuestions_B_index" ON "_TestSeriesQuestions"("B");

-- CreateIndex
CREATE INDEX "_FreePracticeQuestions_B_index" ON "_FreePracticeQuestions"("B");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSeries" ADD CONSTRAINT "TestSeries_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freePractice" ADD CONSTRAINT "freePractice_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_sid_fkey" FOREIGN KEY ("sid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_testSeriesId_fkey" FOREIGN KEY ("testSeriesId") REFERENCES "TestSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participation" ADD CONSTRAINT "Participation_freePracticeId_fkey" FOREIGN KEY ("freePracticeId") REFERENCES "freePractice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_sid_fkey" FOREIGN KEY ("sid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentActivity" ADD CONSTRAINT "StudentActivity_qid_fkey" FOREIGN KEY ("qid") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestSeriesQuestions" ADD CONSTRAINT "_TestSeriesQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TestSeriesQuestions" ADD CONSTRAINT "_TestSeriesQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "TestSeries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreePracticeQuestions" ADD CONSTRAINT "_FreePracticeQuestions_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FreePracticeQuestions" ADD CONSTRAINT "_FreePracticeQuestions_B_fkey" FOREIGN KEY ("B") REFERENCES "freePractice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
