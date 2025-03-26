import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { chunk } from "lodash";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse file from form data
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
    const requiredSheets = [1, 2, 3, 4];
    const competencies: { type: string; name: string; weightage: number; description: string }[] = [];

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
          });
        }
      });
    }

    // Fetch all users
    const users = await prisma.user.findMany({ select: { id: true } });

    // Clear existing data (run in a single transaction)
    await prisma.$transaction([
      prisma.userCompetency.deleteMany({}),
      prisma.competency.deleteMany({})
    ]);

    let competenciesAdded = 0;
    let userCompetenciesAdded = 0;

    // Process competencies
    const newCompetencies = await prisma.competency.createMany({
      data: competencies.map(comp => ({
        competencyType: comp.type,
        competencyName: comp.name,
        weightage: comp.weightage,
        description: comp.description
      })),
      skipDuplicates: true
    });

    competenciesAdded = newCompetencies.count;

    // Fetch newly inserted competencies
    const insertedCompetencies = await prisma.competency.findMany({
      select: { id: true, competencyName: true }
    });

    // Create user-competency mappings in chunks
    const batchSize = 50;
    const userCompetencyData = [];

    for (const comp of insertedCompetencies) {
      for (const user of users) {
        userCompetencyData.push({
          userId: user.id,
          competencyId: comp.id,
          employeeRating: 0,
          managerRating: 0,
          adminRating: 0
        });
      }
    }

    const userCompetencyChunks = chunk(userCompetencyData, batchSize);
    for (const batch of userCompetencyChunks) {
      await prisma.userCompetency.createMany({ data: batch });
      userCompetenciesAdded += batch.length;
    }

    return NextResponse.json({
      success: true,
      competenciesAdded,
      userCompetenciesAdded,
      message: "Competencies processed successfully"
    });

  } catch (error) {
    console.error("Error processing competency upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}
