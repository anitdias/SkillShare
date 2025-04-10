import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from 'xlsx';

interface OrgChartEntry {
    employeeNo: string;
    employeeName: string;
    managerNo: string | null;
    managerName: string | null;
    effectiveDate: Date | null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Basic auth check
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the file from request
    const formData = await request.formData();
    const file = formData.get("file") as Blob;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Parse Excel file
    const bytes = await file.arrayBuffer();
    const workbook = XLSX.read(Buffer.from(bytes), { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length < 2) {
      return NextResponse.json({ error: "File contains insufficient data" }, { status: 400 });
    }

    // Get column indices
    const headers = data[0] as string[];
    const columnMap: Record<string, number> = {};
    ["Employee No", "Employee Name", "Manager No", "Manager Name", "Effective Date"].forEach(col => {
      columnMap[col] = headers.findIndex(h => h?.toString().trim().toLowerCase() === col.toLowerCase());
    });
    
    // Process data rows
    const orgEntries: OrgChartEntry[] = [];
    let topLevelManagerName = "";

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as (string | number)[];
      if (!row[columnMap["Employee No"]] || !row[columnMap["Employee Name"]]) continue;

      const employeeNo = row[columnMap["Employee No"]].toString().trim();
      const employeeName = row[columnMap["Employee Name"]].toString().trim();
      const managerNo = row[columnMap["Manager No"]] ? 
        row[columnMap["Manager No"]].toString().trim() : "";
      const managerName = row[columnMap["Manager Name"]] ? 
        row[columnMap["Manager Name"]].toString().trim() : "";
      
      // Parse effective date if present
      let effectiveDate: Date | null = null;
      if (columnMap["Effective Date"] !== -1 && row[columnMap["Effective Date"]]) {
        const dateValue = row[columnMap["Effective Date"]];
        try {
          // Handle Excel date format (numeric)
          if (typeof dateValue === 'number') {
            effectiveDate = new Date(Math.round((dateValue - 25569) * 86400 * 1000));
          } else {
            // Handle string date format
            effectiveDate = new Date(dateValue.toString());
          }
          
          // Check if date is valid
          if (isNaN(effectiveDate.getTime())) {
            effectiveDate = null;
          }
        } catch (e) {
          console.log(e);
          effectiveDate = null;
        }
      }
      
      if (managerNo.toUpperCase() === "NA" || managerNo === "") {
        topLevelManagerName = employeeName;
      }

      orgEntries.push({
        employeeNo,
        employeeName,
        managerNo: managerNo.toUpperCase() === "NA" ? null : managerNo,
        managerName: managerNo.toUpperCase() === "NA" ? null : managerName,
        effectiveDate
      });
    }

    // Clear existing data and insert new entries
    await prisma.organizationChart.deleteMany({});
    
    for (const entry of orgEntries) {
      await prisma.organizationChart.create({
        data: {
          employeeNo: entry.employeeNo,
          employeeName: entry.employeeName,
          managerNo: entry.managerNo,
          managerName: entry.managerName,
          effectiveDate: entry.effectiveDate
        }
      });
    }

    return NextResponse.json({
      success: true,
      entriesAdded: orgEntries.length,
      topLevelManager: topLevelManagerName || "Not found"
    });

  } catch (error) {
    console.error("Error processing organization chart:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}