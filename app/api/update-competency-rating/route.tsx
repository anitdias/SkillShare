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

    // Extract data from request body
    const { userId, competencyId, rating, userCompetencyId, year } = await request.json();

    if (!userId || !competencyId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Check if user has admin role - admins can rate any employee
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
          { message: "Forbidden: You can only rate your direct subordinates" },
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

    let userCompetency;

    // If userCompetencyId exists, update the existing record
    if (userCompetencyId) {
      // Determine which field to update based on user role
      const updateData = session.user.role === "admin" 
        ? { adminRating: rating }
        : { managerRating: rating };

      userCompetency = await prisma.userCompetency.update({
        where: { id: userCompetencyId },
        data: updateData,
      });
    } else {
      // If no userCompetencyId, create a new record
      // First, verify the competency exists and matches the year
      const competency = await prisma.competency.findUnique({
        where: { id: competencyId },
      });

      if (!competency || competency.year !== Number(year)) {
        return NextResponse.json(
          { message: "Competency not found or year mismatch" },
          { status: 404 }
        );
      }

      // Create new userCompetency with appropriate rating
      const data = {
        userId,
        competencyId,
        employeeRating: 0,
        managerRating: session.user.role === "manager" ? rating : 0,
        adminRating: session.user.role === "admin" ? rating : 0,
      };

      userCompetency = await prisma.userCompetency.create({
        data,
      });
    }

    return NextResponse.json({
      message: "Competency rating updated successfully",
      userCompetency,
    });

  } catch (error) {
    console.error("Error updating competency rating:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}