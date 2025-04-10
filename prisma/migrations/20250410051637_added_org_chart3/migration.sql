/*
  Warnings:

  - You are about to drop the column `managerId` on the `OrganizationChart` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrganizationChart" DROP CONSTRAINT "OrganizationChart_managerId_fkey";

-- AlterTable
ALTER TABLE "OrganizationChart" DROP COLUMN "managerId";

-- AddForeignKey
ALTER TABLE "OrganizationChart" ADD CONSTRAINT "OrganizationChart_managerNo_fkey" FOREIGN KEY ("managerNo") REFERENCES "OrganizationChart"("employeeNo") ON DELETE SET NULL ON UPDATE CASCADE;
