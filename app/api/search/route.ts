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

        const { query } = await request.json();


        const users = await prisma.user.findMany({
            where: {
              name: {
                contains: query,
                mode: 'insensitive', // Case-insensitive search
              },
            },
            select: {
                id: true,   // Include only the `id`
                name: true, // Include only the `name`
              },
          });

        return NextResponse.json(users);

   }catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } 
}