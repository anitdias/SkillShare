import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user?.id) {
        return NextResponse.json(
          { message: "Unauthorized" },
          { status: 401 }
        );
      }
  
      const { skillName, level, roadmap } = await request.json();
      console.log(skillName, level, roadmap);
  
      // Normalize skillName: convert to lowercase and remove spaces
      const finalSkillName = skillName.toLowerCase().replace(/\s+/g, "");
  
      // Use upsert to handle create/update logic in a single query
      const savedRoadmap = await prisma.roadmap.upsert({
        where: {
          userId_skillName_level: {
            userId: session.user.id,
            skillName,
            level,
          },
        },
        update: {
          roadmap,
          createdAt: new Date(), 
        },
        create: {
          userId: session.user.id,
          skillName: finalSkillName,
          level,
          roadmap,
        },
      });
  
      return NextResponse.json(savedRoadmap);
    } catch (error) {
      console.error("Error saving roadmap:", error);
      return NextResponse.json(
        { message: "Internal server error" },
        { status: 500 }
      );
    }
  }