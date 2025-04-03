import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";

export async function PUT(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin or manager role
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Extract data from request body
    const { userId, goalId, rating, userGoalId, year } = await request.json();

    if (!userId || !goalId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    let userGoal;

    // If userGoalId exists, update the existing record
    if (userGoalId) {
      // Determine which field to update based on user role
      const updateData = session.user.role === "admin" 
        ? { adminRating: rating }
        : { managerRating: rating };

      userGoal = await prisma.userGoal.update({
        where: { id: userGoalId },
        data: updateData,
      });
    } else {
      // If no userGoalId, create a new record
      // First, verify the goal exists and matches the year
      const goal = await prisma.goal.findUnique({
        where: { id: goalId },
      });

      if (!goal || goal.year !== Number(year)) {
        return NextResponse.json(
          { message: "Goal not found or year mismatch" },
          { status: 404 }
        );
      }

      // Create new userGoal with appropriate rating
      const data = {
        userId,
        goalId,
        employeeRating: 0,
        managerRating: session.user.role === "manager" ? rating : 0,
        adminRating: session.user.role === "admin" ? rating : 0,
      };

      userGoal = await prisma.userGoal.create({
        data,
      });
    }

    return NextResponse.json({
      message: "Goal rating updated successfully",
      userGoal,
    });

  } catch (error) {
    console.error("Error updating goal rating:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}