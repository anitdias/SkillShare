import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";



export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user skills
    const userSkills = await prisma.userSkill.findMany({
      where: { userId: session.user.id },
      include: { skill: true },
    });

    // Fetch user recommendation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { recommendation: true },
    });

    return NextResponse.json({
      skills: userSkills,
      recommendation: user?.recommendation || null, // Ensure recommendation is always included
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, categoryId, level, description } = await request.json();
    
    // First, create or find the skill
    const skill = await prisma.skill.upsert({
      where: {
          name_categoryId: {
            name,
            categoryId,
          },
      },
      create: {
        name,
        categoryId,
      },
      update: {},
    });

    // Then, create the user skill association with level and description
    const userSkill = await prisma.userSkill.create({
      data: {
        userId: session.user.id,
        skillId: skill.id,
        categoryId,
        level: level || "Level 1",
        description,
      },
      include: {
        skill: true,
      },
    });

    return NextResponse.json(userSkill);
  } catch (error) {
    console.log('Error adding skill:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request){
    try{
      const session: Session | null = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
              { message: 'Unauthorized' },
              { status: 401 }
            );
          }
        
        const { id } = await request.json();

        await prisma.userSkill.delete({
            where: {
                id,
                userId: session.user.id
            }
        });

        return NextResponse.json({
            message: "item deleted"
        })
    }catch(error){
        console.error('Error deleting userSkill item:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );

    }

    

  }

  export async function PUT(request: Request) {
    try {
      const session: Session | null = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }
  
      const { id, level, description } = await request.json();
      
      // Update the user skill
      const userSkill = await prisma.userSkill.update({
        where: {
          id: id,
          userId: session.user.id, // Ensure the user owns this skill
        },
        data: {
          level,
          description,
        },
        include: {
          skill: true,
        },
      });
  
      return NextResponse.json(userSkill);
    } catch (error) {
      console.log('Error updating skill:', error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }
  }