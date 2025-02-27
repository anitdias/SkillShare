import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Session } from "next-auth";

export async function POST(request: Request) {
    try{
      const session: Session | null = await getServerSession(authOptions);

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