import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";

export async function POST(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Extract data from request body
    const { userId, goalName, goalTitle, metric, weightage, goalCategory, year } = await request.json();

    if (!userId || !goalName || !goalTitle || !metric || !weightage || !goalCategory) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user has admin role - admins can add goals for any employee
    if (session.user.role === "admin") {
      // Admin can proceed without additional checks
    } 
    // For managers, check if they are the direct manager of the employee
    else if (session.user.role === "manager") {
      // Get the employee's organization info
      const employeeOrgInfo = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          employeeNo: true 
        }
      });

      if (!employeeOrgInfo?.employeeNo) {
        return NextResponse.json(
          { message: "Employee organization information not found" },
          { status: 404 }
        );
      }

      // Get the manager's employee number directly from session
      if (!session.user.employeeNo) {
        return NextResponse.json(
          { message: "Manager organization information not found" },
          { status: 404 }
        );
      }

      // Check if the manager is the direct manager of the employee
      const isDirectManager = await prisma.organizationChart.findFirst({
        where: {
          employeeNo: employeeOrgInfo.employeeNo,
          managerNo: session.user.employeeNo
        }
      });

      if (!isDirectManager) {
        return NextResponse.json(
          { message: "Forbidden: You can only add goals for your direct subordinates" },
          { status: 403 }
        );
      }
    } else {
      // Not admin or manager
      return NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Create a new goal
    const goal = await prisma.goal.create({
      data: {
        goalName,
        goalTitle,
        metric,
        weightage: Number(weightage),
        goalCategory,
        year: Number(year),
      },
    });

    // Create a user goal mapping
    const userGoal = await prisma.userGoal.create({
      data: {
        userId,
        goalId: goal.id,
        employeeRating: 0,
        managerRating: 0,
        adminRating: 0,
      },
      include: {
        goal: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: "Goal added successfully",
      userGoal,
    });

  } catch (error) {
    console.error("Error adding goal:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}