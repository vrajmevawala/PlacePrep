/*
  Warnings:

  - You are about to drop the column `title` on the `freePractice` table. All the data in the column will be lost.
  - Added the required column `category` to the `freePractice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `level` to the `freePractice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subcategory` to the `freePractice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "freePractice" DROP COLUMN "title",
ADD COLUMN     "category" "Category" NOT NULL,
ADD COLUMN     "level" "Level" NOT NULL,
ADD COLUMN     "subcategory" TEXT NOT NULL;
