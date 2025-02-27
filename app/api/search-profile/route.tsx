import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";



export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Internal Server Error" },
        { status: 500 }
      );
    }

    const { searchedUserId } = await request.json();

    // Fetch user email and image
    const user = await prisma.user.findUnique({
      where: { id: searchedUserId },
      select: { email: true, image: true },
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