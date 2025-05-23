import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";



export async function POST(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }

    const { searchedUserId } = await request.json();

    // Fetch user email, image, description and designation
    const user = await prisma.user.findUnique({
      where: { id: searchedUserId },
      select: { 
        email: true, 
        image: true,
        description: true,
        designation: true 
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Fetch user skills separately
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: searchedUserId },
      include: { skill: true },
    });

    return NextResponse.json({
      email: user.email,
      image: user.image ?? null, // Ensure null if image is not available
      description: user.description ?? null, // Add description to response
      designation: user.designation ?? null, // Add designation to response
      skills: userSkills,
    });

  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}