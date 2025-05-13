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

    // Fetch all users
    let competenciesAdded = 0;
    let userCompetenciesAdded = 0;
    let goalsAdded = 0;
    let userGoalsAdded = 0;

    // Execute all operations in a single transaction
    await prisma.$transaction(async (tx) => {
      // Fetch all users within the transaction
      const users = await tx.user.findMany({ select: { id: true } });

      // Find competency IDs for the current year to delete
      const competencyIdsForYear = await tx.competency.findMany({
        where: { year: currentYear },
        select: { id: true }
      });
      
      const competencyIds = competencyIdsForYear.map(comp => comp.id);
      
      // Find goal IDs for the current year to delete
      const goalIdsForYear = await tx.goal.findMany({
        where: { year: currentYear },
        select: { id: true }
      });
      
      const goalIds = goalIdsForYear.map(goal => goal.id);

      // 1. Clear existing data for the current year
      await tx.userCompetency.deleteMany({
        where: { competencyId: { in: competencyIds } }
      });
      
      await tx.competency.deleteMany({
        where: { year: currentYear }
      });
      
      await tx.userGoal.deleteMany({
        where: { goalId: { in: goalIds } }
      });
      
      await tx.goal.deleteMany({
        where: { year: currentYear }
      });

      // 2. Process competencies
      const newCompetencies = await tx.competency.createMany({
        data: competencies.map(comp => ({
          competencyType: comp.type,
          competencyName: comp.name,
          weightage: comp.weightage,
          description: comp.description,
          year: comp.year
        })),
        skipDuplicates: true
      });

      competenciesAdded = newCompetencies.count;

      // 3. Process goals
      const newGoals = await tx.goal.createMany({
        data: goals.map(goal => ({
          goalCategory: goal.category,
          goalName: goal.name,
          goalTitle: goal.title,
          metric: goal.metric,
          weightage: goal.weightage,
          year: goal.year
        })),
        skipDuplicates: true
      });

      goalsAdded = newGoals.count;

      // 4. Fetch newly inserted competencies
      const insertedCompetencies = await tx.competency.findMany({
        where: { year: currentYear },
        select: { id: true, competencyName: true }
      });

      // 5. Fetch newly inserted goals
      const insertedGoals = await tx.goal.findMany({
        where: { year: currentYear },
        select: { id: true, goalName: true }
      });

      // 6. Create user-competency mappings in chunks
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
        await tx.userCompetency.createMany({ data: batch });
        userCompetenciesAdded += batch.length;
      }
      
      // 7. Create user-goal mappings in chunks
      const userGoalData = [];

      for (const goal of insertedGoals) {
        for (const user of users) {
          userGoalData.push({
            userId: user.id,
            goalId: goal.id,
            employeeRating: 0,
            managerRating: 0,
            adminRating: 0
          });
        }
      }

      const userGoalChunks = chunk(userGoalData, batchSize);
      for (const batch of userGoalChunks) {
        await tx.userGoal.createMany({ data: batch });
        userGoalsAdded += batch.length;
      }
    }, {
      // Use a longer timeout for this complex transaction
      timeout: 60000 // 60 seconds
    });

    return NextResponse.json({
      success: true,
      competenciesAdded,
      userCompetenciesAdded,
      goalsAdded,
      userGoalsAdded,
      year: currentYear,
      message: `Goals and Competencies for year ${currentYear} processed successfully`
    });

  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}