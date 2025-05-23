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

    const userCompetencies = await prisma.userCompetency.findMany({
      where: {
        userId: session.user.id,
        competency: {
          year: year
        }
      },
      include: {
        competency: true
      }
    });

    return NextResponse.json(userCompetencies);
  } catch (error) {
    console.error("Error fetching competencies:", error);
    return NextResponse.json(
      { error: "Failed to fetch competencies" },
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

    const { userCompetencyId, rating } = await request.json();

    if (!userCompetencyId || rating === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify the user owns this competency record
    const userCompetency = await prisma.userCompetency.findUnique({
      where: {
        id: userCompetencyId,
      },
    });

    if (!userCompetency || userCompetency.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized access to this competency" }, { status: 403 });
    }

    // Update the employee rating
    const updatedCompetency = await prisma.userCompetency.update({
      where: {
        id: userCompetencyId,
      },
      data: {
        employeeRating: rating,
      },
    });

    return NextResponse.json(updatedCompetency);
  } catch (error) {
    console.error("Error updating competency rating:", error);
    return NextResponse.json(
      { error: "Failed to update competency rating" },
      { status: 500 }
    );
  }
}