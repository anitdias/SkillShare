/*
  Warnings:

  - You are about to drop the column `userId` on the `OrganizationChart` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrganizationChart" DROP CONSTRAINT "OrganizationChart_userId_fkey";

-- DropIndex
DROP INDEX "OrganizationChart_userId_key";

-- AlterTable
ALTER TABLE "OrganizationChart" DROP COLUMN "userId";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employeeNo_fkey" FOREIGN KEY ("employeeNo") REFERENCES "OrganizationChart"("employeeNo") ON DELETE SET NULL ON UPDATE CASCADE;
