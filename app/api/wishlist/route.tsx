import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";



export async function GET() {
  try {
    const session: Session | null = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const wishlist = await prisma.skillWishlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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

    const { skillName, categoryId, description } = await request.json();

    const wishlistItem = await prisma.skillWishlist.create({
      data: {
        userId: session.user.id,
        skillName,
        categoryId,
        description,
      },
    });

    return NextResponse.json(wishlistItem);
  } catch (error) {
    console.error('Error adding wishlist item:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    await prisma.skillWishlist.delete({
      where: {
        id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: 'Wishlist item deleted' });
  } catch (error) {
    console.error('Error deleting wishlist item:', error);
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

    const { id, description } = await request.json();
    
    // Update the wishlist item
    const wishlistItem = await prisma.skillWishlist.update({
      where: {
        id: id,
        userId: session.user.id, // Ensure the user owns this wishlist item
      },
      data: {
        description,
      },
    });

    return NextResponse.json(wishlistItem);
  } catch (error) {
    console.log('Error updating wishlist item:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}