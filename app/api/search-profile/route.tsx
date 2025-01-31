import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";



export async function POST(request: Request) {
    try{
        const session = await getServerSession(authOptions);


        if(!session?.user?.id){
            return NextResponse.json(
                { message: 'Internal Server Error'},
                {status: 500}
            );
        }

        const { searchedUserId } = await request.json();
        
        const userSkills = await prisma.userSkill.findMany({
            where: {userId: searchedUserId},
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