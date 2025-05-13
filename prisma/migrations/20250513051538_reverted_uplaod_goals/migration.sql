/*
  Warnings:

  - You are about to drop the `ImportJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ImportJob" DROP CONSTRAINT "ImportJob_userId_fkey";

-- DropTable
DROP TABLE "ImportJob";

-- DropEnum
DROP TYPE "JobStatus";

-- CreateTable
CREATE TABLE "SystemStatus" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemStatus_pkey" PRIMARY KEY ("key")
);
