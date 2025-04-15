/*
  Warnings:

  - You are about to drop the `TempImportData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TempImportData" DROP CONSTRAINT "TempImportData_jobId_fkey";

-- DropTable
DROP TABLE "TempImportData";
