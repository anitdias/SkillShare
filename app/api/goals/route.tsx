import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the year from query parameters
    const url = new URL(req.url);
    const yearParam = url.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    const userGoals = await prisma.userGoal.findMany({
      where: {
        userId: session.user.id,
        goal: {
          year: year
        }
      },
      include: {
        goal: true
      }
    });

    return NextResponse.json(userGoals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userGoalId, rating } = await request.json();

    if (!userGoalId || rating === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the user owns this goal record
    const userGoal = await prisma.userGoal.findUnique({
      where: {
        id: userGoalId,
      },
    });

    if (!userGoal || userGoal.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this goal" }, { status: 403 });
    }

    // Update the employee rating
    const updatedGoal = await prisma.userGoal.update({
      where: {
        id: userGoalId,
      },
      data: {
        employeeRating: rating,
      },
    });

    return NextResponse.json(updatedGoal);
  } catch (error) {
    console.error("Error updating goal rating:", error);
    return NextResponse.json(
      { error: "Failed to update goal rating" },
      { status: 500 }
    );
  }
}