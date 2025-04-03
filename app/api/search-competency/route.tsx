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

    // Check if user has admin or manager role
    if (session.user.role !== "admin" && session.user.role !== "manager") {
      return NextResponse.json(
        { message: "Forbidden: Insufficient permissions" },
        { status: 403 }
      );
    }

    // Extract userId and year from request body
    const { searchedUserId, year = new Date().getFullYear() } = await request.json();

    // Fetch basic user information
    const user = await prisma.user.findUnique({
      where: { id: searchedUserId },
      select: { 
        id: true,
        email: true, 
        image: true,
        name: true,
        designation: true,
        description: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch all competencies for the specified year
    const competencies = await prisma.competency.findMany({
      where: { year: Number(year) },
    });

    // Fetch user competencies for the specified year
    const userCompetencies = await prisma.userCompetency.findMany({
      where: { 
        userId: searchedUserId,
        competency: {
          year: Number(year)
        }
      },
      include: {
        competency: true,
      },
    });

    // Fetch all goals for the specified year
    const goals = await prisma.goal.findMany({
      where: { year: Number(year) },
    });

    // Fetch user goals for the specified year
    const userGoals = await prisma.userGoal.findMany({
      where: { 
        userId: searchedUserId,
        goal: {
          year: Number(year)
        }
      },
      include: {
        goal: true,
      },
    });

    // Group competencies by type for better organization
    const competencyTypes = [...new Set(competencies.map(comp => comp.competencyType))];
    const groupedCompetencies = competencyTypes.map(type => {
      const typeCompetencies = competencies.filter(comp => comp.competencyType === type);
      
      // Map each competency to include user ratings if available
      const mappedCompetencies = typeCompetencies.map(comp => {
        const userComp = userCompetencies.find(uc => uc.competencyId === comp.id);
        return {
          ...comp,
          employeeRating: userComp?.employeeRating || 0,
          managerRating: userComp?.managerRating || 0,
          adminRating: userComp?.adminRating || 0,
          userCompetencyId: userComp?.id || null
        };
      });
      
      return {
        type,
        competencies: mappedCompetencies
      };
    });

    // Group goals by category for better organization
    const mappedGoals = goals.map(goal => {
        const userGoal = userGoals.find(ug => ug.goalId === goal.id);
        return {
          ...goal,
          employeeRating: userGoal?.employeeRating || 0,
          managerRating: userGoal?.managerRating || 0,
          adminRating: userGoal?.adminRating || 0,
          userGoalId: userGoal?.id || null
        };
      });
  
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          image: user.image ?? null,
          name: user.name,
          designation: user.designation,
          description: user.description,
        },
        competencies: groupedCompetencies,
        goals: mappedGoals,
        year: Number(year),
      });

  } catch (error) {
    console.error("Error fetching competency details:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}