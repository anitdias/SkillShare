import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse file from form data
    const formData = await req.formData();
    const file = formData.get("file") as Blob;
    const yearParam = formData.get("year");
    
    // Get the year (use provided year or default to current year)
    const currentYear = yearParam ? parseInt(yearParam as string) : new Date().getFullYear();
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read and parse the Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    // Process Goals from sheet 0
    const goals: { category: string; name: string; title: string; metric: string; weightage: number; year: number }[] = [];
    
    if (workbook.SheetNames[0]) {
      const goalsSheet = workbook.Sheets[workbook.SheetNames[0]];
      const goalsData = XLSX.utils.sheet_to_json(goalsSheet);
      
      goalsData.forEach((row) => {
        const typedRow = row as Record<string, unknown>;
        if (typeof typedRow["Goal Name"] === "string" && typeof typedRow["Goal Category"] === "string") {
          goals.push({
            category: String(typedRow["Goal Category"]),
            name: String(typedRow["Goal Name"]),
            title: String(typedRow["Goal Title"] || ""),
            metric: String(typedRow["Metric"] || ""),
            weightage: Number(typedRow["Weightage"]) || 0,
            year: currentYear
          });
        }
      });
    }
    
    // Process Competencies from sheets 1-4
    const requiredSheets = [1, 2, 3, 4];
    const competencies: { type: string; name: string; weightage: number; description: string; year: number }[] = [];

    for (const index of requiredSheets) {
      if (!workbook.SheetNames[index]) continue;
      const sheet = workbook.Sheets[workbook.SheetNames[index]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      jsonData.forEach((row) => {
        const typedRow = row as Record<string, unknown>;
        if (typeof typedRow["Competency type"] === "string" && typeof typedRow["Competency Name"] === "string") {
          competencies.push({
            type: typedRow["Competency type"],
            name: typedRow["Competency Name"],
            weightage: Number(typedRow["Weightage"]) || 0,
            description: String(typedRow["Description"] || ""),
            year: currentYear
          });
        }
      });
    }

    // Create a job record to track progress
    const job = await prisma.importJob.create({
      data: {
        userId: session.user.id,
        year: currentYear,
        status: "PENDING",
        data: {
          goals,
          competencies
        },
        steps: {
          clearData: "PENDING",
          importCompetencies: "PENDING",
          importGoals: "PENDING",
          mapCompetencies: "PENDING",
          mapGoals: "PENDING"
        }
      }
    });

    // Instead of using fetch, directly process the first step
    // This avoids the localhost connection issue on Vercel
    try {
      // Call the first step directly
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      
      const processUrl = new URL('/api/upload-excel/process-step', baseUrl);
      processUrl.searchParams.append("jobId", job.id);
      processUrl.searchParams.append("step", "1");
      
      // Make the request with absolute URL
      fetch(processUrl.toString(), {
        method: 'POST',
        headers: {
          // Add host header to ensure proper routing
          'Host': processUrl.host
        }
      }).catch(err => console.error("Error triggering first step:", err));
    } catch (err) {
      console.error("Error setting up processing:", err);
      // Continue anyway - the user can manually trigger processing if needed
    }

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Excel file processed. Data import has started for year ${currentYear}. You can check the status using the job ID.`
    });

  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}