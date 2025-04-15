-- CreateTable
CREATE TABLE "TempImportData" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TempImportData_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TempImportData" ADD CONSTRAINT "TempImportData_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
