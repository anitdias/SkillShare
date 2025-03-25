import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

interface Competency {
  type: string;
  name: string;
  weightage: number;
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file Blob to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Read and parse the Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const requiredSheets = [2, 3, 4];
    const competencies: Competency[] = [];

    for (const index of requiredSheets) {
      if (!workbook.SheetNames[index]) continue; // Skip if sheet doesn't exist

      const sheet = workbook.Sheets[workbook.SheetNames[index]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      jsonData.forEach((row) => {
        const typedRow = row as Record<string, unknown>; // Explicitly type row

        if (typeof typedRow["Competency type"] === "string" && typeof typedRow["Competency Name"] === "string") {
          competencies.push({
            type: typedRow["Competency type"],
            name: typedRow["Competency Name"],
            weightage: Number(typedRow["Weightage"]) || 0, // Ensure number type
            description: String(typedRow["Description"] || ""), // Ensure string type
          });
        }
      });
    }

    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true }
    });
    
    let competenciesAdded = 0;
    let userCompetenciesAdded = 0;
    
    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // First, truncate both tables
      await tx.userCompetency.deleteMany({});
      await tx.competency.deleteMany({});
      
      // Process each competency
      for (const comp of competencies) {
        // Create new competency (no need to check existence as table is empty)
        const competency = await tx.competency.create({
          data: {
            competencyType: comp.type,
            competencyName: comp.name,
            weightage: comp.weightage,
            description: comp.description
          }
        });
        competenciesAdded++;
        
        // Create user competency mappings for all users
        await Promise.all(users.map(async (user) => {
          await tx.userCompetency.create({
            data: {
              userId: user.id,
              competencyId: competency.id,
              employeeRating: 0,
              managerRating: 0,
              adminRating: 0
            }
          });
          userCompetenciesAdded++;
        }));
      }
    });
      
      return NextResponse.json({
        success: true,
        competenciesAdded,
        userCompetenciesAdded,
        message: 'Competencies processed successfully'
      });
      
    } catch (error) {
      console.error("Error processing competency upload:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
