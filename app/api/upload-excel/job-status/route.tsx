import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const jobId = url.searchParams.get("jobId");
    
    if (!jobId) {
      // If no job ID is provided, return the most recent job for this user
      const recentJob = await prisma.importJob.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' }
      });
      
      if (!recentJob) {
        return NextResponse.json({ error: "No jobs found" }, { status: 404 });
      }
      
      return NextResponse.json({ job: recentJob });
    }
    
    // Get the specific job
    const job = await prisma.importJob.findUnique({
      where: { id: jobId }
    });
    
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    
    // Check if user is authorized to view this job
    if (job.userId !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    
    return NextResponse.json({ job });
    
  } catch (error) {
    console.error("Error getting job status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}