/*
  Warnings:

  - A unique constraint covering the columns `[competencyType,competencyName,year]` on the table `Competency` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Competency_competencyType_competencyName_key";

-- AlterTable
ALTER TABLE "Competency" ADD COLUMN     "year" INTEGER NOT NULL DEFAULT 2024;

-- CreateIndex
CREATE UNIQUE INDEX "Competency_competencyType_competencyName_year_key" ON "Competency"("competencyType", "competencyName", "year");
