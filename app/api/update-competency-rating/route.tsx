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
    const { userId, competencyId, rating, userCompetencyId, year } = await request.json();

    if (!userId || !competencyId || !rating || rating < 1 || rating > 4) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
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
      message: "Rating updated successfully",
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