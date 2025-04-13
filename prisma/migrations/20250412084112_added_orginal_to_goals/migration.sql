/*
  Warnings:

  - You are about to drop the `SystemStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "original" TEXT;

-- DropTable
DROP TABLE "SystemStatus";
