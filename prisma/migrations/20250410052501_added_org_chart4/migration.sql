-- DropForeignKey
ALTER TABLE "OrganizationChart" DROP CONSTRAINT "OrganizationChart_managerNo_fkey";

-- AlterTable
ALTER TABLE "OrganizationChart" ADD COLUMN     "managerId" TEXT;

-- AddForeignKey
ALTER TABLE "OrganizationChart" ADD CONSTRAINT "OrganizationChart_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "OrganizationChart"("employeeNo") ON DELETE SET NULL ON UPDATE CASCADE;
