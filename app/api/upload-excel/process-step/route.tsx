import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { chunk } from "lodash";
import { Prisma } from "@prisma/client";

interface CompetencyData {
  type: string;
  name: string;
  weightage: number;
  description: string;
  year: number;
}

interface GoalData {
  category: string;
  name: string;
  title: string;
  metric: string;
  weightage: number;
  year: number;
}

interface JobData {
  competencies: CompetencyData[];
  goals: GoalData[];
}

interface JobSteps {
  clearData?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  importCompetencies?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  importGoals?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  mapCompetencies?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  mapGoals?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId");
    const step = parseInt(url.searchParams.get("step") || "1");
    
    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }
    
    // Get the job
    const job = await prisma.importJob.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    
    if (job.status === "FAILED") {
      return NextResponse.json({ error: "Job has failed" }, { status: 400 });
    }
    
    if (job.status === "COMPLETED") {
      return NextResponse.json({ message: "Job already completed" });
    }
    
    // Update job status to processing
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" }
    });
    
    // Cast the job data and steps with proper type handling
    const steps = job.steps as unknown as JobSteps;
    const data = job.data as unknown as JobData;
    const year = job.year;
    
    try {
      // Process the current step
      switch (step) {
        case 1: // Clear existing data
          await clearExistingData(year);
          steps.clearData = "COMPLETED";
          break;
          
        case 2: // Import competencies
          await importCompetencies(data.competencies);
          steps.importCompetencies = "COMPLETED";
          break;
          
        case 3: // Import goals
          await importGoals(data.goals);
          steps.importGoals = "COMPLETED";
          break;
          
        case 4: // Map competencies to users
          await mapCompetenciesToUsers(year);
          steps.mapCompetencies = "COMPLETED";
          break;
          
        case 5: // Map goals to users
          await mapGoalsToUsers(year);
          steps.mapGoals = "COMPLETED";
          break;
          
        default:
          throw new Error("Invalid step");
      }
      
      // Update job with step progress - convert steps back to JSON
      await prisma.importJob.update({
        where: { id: jobId },
        data: { 
          steps: steps as unknown as Prisma.JsonObject 
        }
      });
      
      // Check if there are more steps to process
      if (step < 5) {
        // Trigger the next step asynchronously with the approach that worked for step 1
        try {
          // Use a fixed base URL for production or fallback to localhost for development
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://skill-share-six.vercel.app' 
            : 'http://localhost:3000';
          
          console.log(`Using base URL: ${baseUrl} to trigger next step`);
          
          // Construct the full URL directly
          const processUrl = `${baseUrl}/api/upload-excel/process-step?jobId=${jobId}&step=${step + 1}`;
          
          console.log(`Triggering next step ${step + 1} at: ${processUrl}`);
          
          // Make the request with simplified configuration
          fetch(processUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          }).catch(err => console.error(`Error triggering step ${step + 1}:`, err));
          
          console.log(`Request sent for step ${step + 1}`);
        } catch (err) {
          console.error(`Error setting up step ${step + 1}:`, err);
          // Continue anyway - the job status will show progress
        }
        
        return NextResponse.json({ success: true, message: `Step ${step} completed, processing step ${step + 1}` });
      } else {
        // All steps completed
        await prisma.importJob.update({
          where: { id: jobId },
          data: { 
            status: "COMPLETED",
            completedAt: new Date()
          }
        });
        
        return NextResponse.json({ success: true, message: "All steps completed" });
      }
      
    } catch (error) {
      // Update job status to failed
      await prisma.importJob.update({
        where: { id: jobId },
        data: { 
          status: "FAILED",
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
      
      throw error;
    }
    
  } catch (error) {
    console.error("Error processing step:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}

// Step 1: Clear existing data
async function clearExistingData(year: number) {
  // Find competency IDs for the current year to delete
  const competencyIdsForYear = await prisma.competency.findMany({
    where: { year },
    select: { id: true }
  });
  
  const competencyIds = competencyIdsForYear.map(comp => comp.id);
  
  // Find goal IDs for the current year to delete
  const goalIdsForYear = await prisma.goal.findMany({
    where: { year },
    select: { id: true }
  });
  
  const goalIds = goalIdsForYear.map(goal => goal.id);

  // Clear existing data for the current year only (run in a single transaction)
  await prisma.$transaction([
    prisma.userCompetency.deleteMany({
      where: { competencyId: { in: competencyIds } }
    }),
    prisma.competency.deleteMany({
      where: { year }
    }),
    prisma.userGoal.deleteMany({
      where: { goalId: { in: goalIds } }
    }),
    prisma.goal.deleteMany({
      where: { year }
    })
  ]);
}

// Step 2: Import competencies
async function importCompetencies(competencies: CompetencyData[]) {
  await prisma.competency.createMany({
    data: competencies.map(comp => ({
      competencyType: comp.type,
      competencyName: comp.name,
      weightage: comp.weightage,
      description: comp.description,
      year: comp.year
    })),
    skipDuplicates: true
  });
}

// Step 3: Import goals
async function importGoals(goals: GoalData[]) {
  await prisma.goal.createMany({
    data: goals.map(goal => ({
      goalCategory: goal.category,
      goalName: goal.name,
      goalTitle: goal.title,
      metric: goal.metric,
      original: "true",
      weightage: goal.weightage,
      year: goal.year
    })),
    skipDuplicates: true
  });
}

// Step 4: Map competencies to users
async function mapCompetenciesToUsers(year: number) {
  // Fetch all users with employee numbers
  const users = await prisma.user.findMany({ 
    where: { employeeNo: { not: null } },
    select: { id: true } 
  });
  
  // Fetch newly inserted competencies
  const insertedCompetencies = await prisma.competency.findMany({
    where: { year },
    select: { id: true }
  });
  
  // Create user-competency mappings in chunks
  const batchSize = 100;
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
    await prisma.userCompetency.createMany({ 
      data: batch,
      skipDuplicates: true
    });
  }
}

// Step 5: Map goals to users
// Step 5: Map goals to users
async function mapGoalsToUsers(year: number) {
  // Fetch all users with employee numbers
  const users = await prisma.user.findMany({ 
    where: { employeeNo: { not: null } },
    select: { id: true } 
  });
  
  // Fetch newly inserted goals
  const insertedGoals = await prisma.goal.findMany({
    where: { year },
    select: { id: true }
  });
  
  console.log(`Found ${users.length} users and ${insertedGoals.length} goals. Expected mappings: ${users.length * insertedGoals.length}`);
  
  // Create user-goal mappings in chunks
  const batchSize = 100;
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
  
  console.log(`Created ${userGoalData.length} user-goal mappings to insert`);
  
  // Process in smaller batches to ensure all are processed
  const userGoalChunks = chunk(userGoalData, batchSize);
  console.log(`Split into ${userGoalChunks.length} batches of max ${batchSize} items`);
  
  for (let i = 0; i < userGoalChunks.length; i++) {
    const batch = userGoalChunks[i];
    console.log(`Processing batch ${i+1}/${userGoalChunks.length} with ${batch.length} items`);
    
    await prisma.userGoal.createMany({ 
      data: batch,
      skipDuplicates: true
    });
  }
  
  // Verify the count after insertion
  const count = await prisma.userGoal.count({
    where: {
      goalId: {
        in: insertedGoals.map(g => g.id)
      }
    }
  });
  
  console.log(`After insertion: ${count} user-goal mappings found in database`);
}