import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get distinct years from competencies
    const years = await prisma.competency.findMany({
      select: {
        year: true
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc'
      }
    });

    // Extract years into an array
    const availableYears = years.map(y => y.year);
    
    // If no years found, return current year
    if (availableYears.length === 0) {
      return NextResponse.json([new Date().getFullYear()]);
    }

    return NextResponse.json(availableYears);
  } catch (error) {
    console.error("Error fetching available years:", error);
    return NextResponse.json(
      { error: "Failed to fetch available years" },
      { status: 500 }
    );
  }
}