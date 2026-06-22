/*
  Warnings:

  - You are about to drop the column `formats` on the `EditorProfile` table. All the data in the column will be lost.
  - You are about to drop the column `formats` on the `Vacancy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EditorProfile" DROP COLUMN "formats",
ADD COLUMN     "games" TEXT[],
ADD COLUMN     "sections" TEXT[];

-- AlterTable
ALTER TABLE "PortfolioLink" ADD COLUMN     "section" TEXT;

-- AlterTable
ALTER TABLE "Vacancy" DROP COLUMN "formats",
ADD COLUMN     "games" TEXT[],
ADD COLUMN     "sections" TEXT[];

-- DropEnum
DROP TYPE "ContentFormat";
