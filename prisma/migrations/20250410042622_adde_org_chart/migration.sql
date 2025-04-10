/*
  Warnings:

  - A unique constraint covering the columns `[employeeNo]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employeeNo" TEXT;

-- CreateTable
CREATE TABLE "OrganizationChart" (
    "id" TEXT NOT NULL,
    "employeeNo" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "managerNo" TEXT,
    "managerName" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "OrganizationChart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationChart_employeeNo_key" ON "OrganizationChart"("employeeNo");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationChart_userId_key" ON "OrganizationChart"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeNo_key" ON "User"("employeeNo");

-- AddForeignKey
ALTER TABLE "OrganizationChart" ADD CONSTRAINT "OrganizationChart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationChart" ADD CONSTRAINT "OrganizationChart_managerNo_fkey" FOREIGN KEY ("managerNo") REFERENCES "OrganizationChart"("employeeNo") ON DELETE SET NULL ON UPDATE CASCADE;
