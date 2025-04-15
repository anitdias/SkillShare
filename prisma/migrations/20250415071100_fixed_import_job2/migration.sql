-- DropForeignKey
ALTER TABLE "TempImportData" DROP CONSTRAINT "TempImportData_jobId_fkey";

-- AddForeignKey
ALTER TABLE "TempImportData" ADD CONSTRAINT "TempImportData_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
