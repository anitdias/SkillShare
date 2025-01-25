import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";



export async function GET() {
    try{
        const session = await getServerSession(authOptions);

        if(!session?.user?.id){
            return NextResponse.json(
                { message: 'Internal Server Error'},
                {status: 500}
            );
        }

        const userSkills = await prisma.userSkill.findMany({
            where: {userId: session.user.id},
            include: {skill: true}
        });

        return NextResponse.json(userSkills);

   }catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } 
}

export async function POST(request: Request) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        );
      }
  
      const { name, categoryId } = await request.json();
      
  
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
  
      // Then, create the user skill association
      const userSkill = await prisma.userSkill.create({
        data: {
          userId: session.user.id,
          skillId: skill.id,
          categoryId,
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