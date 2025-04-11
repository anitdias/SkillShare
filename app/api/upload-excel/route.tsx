import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { chunk } from "lodash";

// Set smaller batch sizes to avoid timeouts
const BATCH_SIZE = 10;

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

    // Start a background job to process the data
    // This allows us to return a response quickly while processing continues
    processDataInBackground(currentYear, competencies, goals)
      .catch(err => console.error("Background processing error:", err));

    // Return an immediate response
    return NextResponse.json({
      success: true,
      message: `Processing started for year ${currentYear}. This may take a few minutes to complete.`,
      status: "PROCESSING"
    });

  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}

// Separate function to handle the background processing
async function processDataInBackground(
  currentYear: number,
  competencies: { type: string; name: string; weightage: number; description: string; year: number }[],
  goals: { category: string; name: string; title: string; metric: string; weightage: number; year: number }[]
) {
  try {
    // Update status to PROCESSING
    await prisma.systemStatus.upsert({
      where: { key: `excel_import_${currentYear}` },
      update: { 
        value: JSON.stringify({
          status: "PROCESSING",
          startedAt: new Date().toISOString()
        })
      },
      create: {
        key: `excel_import_${currentYear}`,
        value: JSON.stringify({
          status: "PROCESSING",
          startedAt: new Date().toISOString()
        })
      }
    });

    // Find competency IDs for the current year to delete
    const competencyIdsForYear = await prisma.competency.findMany({
      where: { year: currentYear },
      select: { id: true }
    });
    
    const competencyIds = competencyIdsForYear.map(comp => comp.id);
    
    // Find goal IDs for the current year to delete
    const goalIdsForYear = await prisma.goal.findMany({
      where: { year: currentYear },
      select: { id: true }
    });
    
    const goalIds = goalIdsForYear.map(goal => goal.id);

    // Update status to indicate deletion in progress
    await prisma.systemStatus.update({
      where: { key: `excel_import_${currentYear}` },
      data: { 
        value: JSON.stringify({
          status: "PROCESSING",
          step: "Deleting existing data",
          startedAt: new Date().toISOString()
        })
      }
    });

    // Clear existing data for the current year only (run in a single transaction)
    await prisma.$transaction([
      prisma.userCompetency.deleteMany({
        where: { competencyId: { in: competencyIds } }
      }),
      prisma.competency.deleteMany({
        where: { year: currentYear }
      }),
      prisma.userGoal.deleteMany({
        where: { goalId: { in: goalIds } }
      }),
      prisma.goal.deleteMany({
        where: { year: currentYear }
      })
    ]);

    // Update status to indicate adding competencies
    await prisma.systemStatus.update({
      where: { key: `excel_import_${currentYear}` },
      data: { 
        value: JSON.stringify({
          status: "PROCESSING",
          step: "Adding competencies",
          startedAt: new Date().toISOString()
        })
      }
    });

    // Process competencies in smaller batches
    let competencyCount = 0;
    const competencyBatches = chunk(competencies, BATCH_SIZE);
    for (const batch of competencyBatches) {
      const result = await prisma.competency.createMany({
        data: batch.map(comp => ({
          competencyType: comp.type,
          competencyName: comp.name,
          weightage: comp.weightage,
          description: comp.description,
          year: comp.year
        })),
        skipDuplicates: true
      });
      competencyCount += result.count;
    }

    // Update status to indicate adding goals
    await prisma.systemStatus.update({
      where: { key: `excel_import_${currentYear}` },
      data: { 
        value: JSON.stringify({
          status: "PROCESSING",
          step: "Adding goals",
          competenciesAdded: competencyCount,
          startedAt: new Date().toISOString()
        })
      }
    });

    // Process goals in smaller batches
    let goalCount = 0;
    const goalBatches = chunk(goals, BATCH_SIZE);
    for (const batch of goalBatches) {
      const result = await prisma.goal.createMany({
        data: batch.map(goal => ({
          goalCategory: goal.category,
          goalName: goal.name,
          goalTitle: goal.title,
          metric: goal.metric,
          weightage: goal.weightage,
          year: goal.year
        })),
        skipDuplicates: true
      });
      goalCount += result.count;
    }

    // Update status to indicate fetching inserted data
    await prisma.systemStatus.update({
      where: { key: `excel_import_${currentYear}` },
      data: { 
        value: JSON.stringify({
          status: "PROCESSING",
          step: "Fetching inserted data",
          competenciesAdded: competencyCount,
          goalsAdded: goalCount,
          startedAt: new Date().toISOString()
        })
      }
    });

    // Fetch newly inserted competencies
    const insertedCompetencies = await prisma.competency.findMany({
      where: { year: currentYear },
      select: { id: true }
    });

    // Fetch newly inserted goals
    const insertedGoals = await prisma.goal.findMany({
      where: { year: currentYear },
      select: { id: true }
    });

    // Update status to indicate creating user mappings
    await prisma.systemStatus.update({
      where: { key: `excel_import_${currentYear}` },
      data: { 
        value: JSON.stringify({
          status: "PROCESSING",
          step: "Creating user mappings",
          competenciesAdded: competencyCount,
          goalsAdded: goalCount,
          startedAt: new Date().toISOString()
        })
      }
    });

    // Fetch all users at once to reduce database calls
    const allUsers = await prisma.user.findMany({
      select: { id: true }
    });
    
    // Process user competencies in smaller batches
    let userCompetencyCount = 0;
    for (const comp of insertedCompetencies) {
      const userCompetencyData = allUsers.map(user => ({
        userId: user.id,
        competencyId: comp.id,
        employeeRating: 0,
        managerRating: 0,
        adminRating: 0
      }));
      
      // Insert in smaller chunks
      const userCompetencyChunks = chunk(userCompetencyData, BATCH_SIZE);
      for (const batch of userCompetencyChunks) {
        const result = await prisma.userCompetency.createMany({ 
          data: batch,
          skipDuplicates: true
        });
        userCompetencyCount += result.count;
      }
      
      // Update progress periodically
      await prisma.systemStatus.update({
        where: { key: `excel_import_${currentYear}` },
        data: { 
          value: JSON.stringify({
            status: "PROCESSING",
            step: "Creating user competency mappings",
            competenciesAdded: competencyCount,
            goalsAdded: goalCount,
            userCompetencyMappingsAdded: userCompetencyCount,
            startedAt: new Date().toISOString()
          })
        }
      });
    }
    
    // Process user goals in smaller batches
    let userGoalCount = 0;
    for (const goal of insertedGoals) {
      const userGoalData = allUsers.map(user => ({
        userId: user.id,
        goalId: goal.id,
        employeeRating: 0,
        managerRating: 0,
        adminRating: 0
      }));
      
      // Insert in smaller chunks
      const userGoalChunks = chunk(userGoalData, BATCH_SIZE);
      for (const batch of userGoalChunks) {
        const result = await prisma.userGoal.createMany({ 
          data: batch,
          skipDuplicates: true 
        });
        userGoalCount += result.count;
      }
      
      // Update progress periodically
      await prisma.systemStatus.update({
        where: { key: `excel_import_${currentYear}` },
        data: { 
          value: JSON.stringify({
            status: "PROCESSING",
            step: "Creating user goal mappings",
            competenciesAdded: competencyCount,
            goalsAdded: goalCount,
            userCompetencyMappingsAdded: userCompetencyCount,
            userGoalMappingsAdded: userGoalCount,
            startedAt: new Date().toISOString()
          })
        }
      });
    }
    
    // Update status record to indicate completion
    await prisma.systemStatus.update({
      where: { key: `excel_import_${currentYear}` },
      data: { 
        value: JSON.stringify({
          status: "COMPLETED",
          competenciesAdded: competencyCount,
          goalsAdded: goalCount,
          userCompetencyMappingsAdded: userCompetencyCount,
          userGoalMappingsAdded: userGoalCount,
          completedAt: new Date().toISOString()
        })
      }
    });
    
  } catch (error) {
    console.error("Background processing error:", error);
    
    // Update status to error
    await prisma.systemStatus.upsert({
      where: { key: `excel_import_${currentYear}` },
      update: { 
        value: JSON.stringify({
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          errorAt: new Date().toISOString()
        })
      },
      create: {
        key: `excel_import_${currentYear}`,
        value: JSON.stringify({
          status: "ERROR",
          error: error instanceof Error ? error.message : "Unknown error",
          errorAt: new Date().toISOString()
        })
      }
    });
  }
}