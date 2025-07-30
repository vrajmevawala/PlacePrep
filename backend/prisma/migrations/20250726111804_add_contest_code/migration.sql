/*
  Warnings:

  - A unique constraint covering the columns `[contestCode]` on the table `TestSeries` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "TestSeries" ADD COLUMN     "contestCode" TEXT,
ADD COLUMN     "requiresCode" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "TestSeries_contestCode_key" ON "TestSeries"("contestCode");
