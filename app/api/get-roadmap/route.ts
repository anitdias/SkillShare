import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if the user is authenticated
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const { skillName,level } = await request.json();

    // Normalize skillName: convert to lowercase and remove spaces
    const finalSkillName = skillName.toLowerCase().replace(/\s+/g, "");

    // Fetch the roadmap from the database using the user's ID and normalized skillName
    const savedRoadmap = await prisma.roadmap.findFirst({
      where: {
        userId: session.user.id,
        skillName: finalSkillName,
        level // The normalized skill name
      },
      select: {
        roadmap: true
         },
    });

    // Check if a roadmap was found
    if (!savedRoadmap) {
      return NextResponse.json(
        { message: "No roadmap found for this skill" }
      );
    }

    // Return the saved roadmap
    return NextResponse.json(savedRoadmap);
  } catch (error) {
    console.error("Error fetching roadmap:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
