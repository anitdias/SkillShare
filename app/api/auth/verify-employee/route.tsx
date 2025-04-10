import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { employeeNo: true }
      });
  
      if (existingUser?.employeeNo) {
        return NextResponse.json({ 
          error: 'Employee number already assigned',
          redirect: '/profile'
        }, { status: 400 });
      }
    
    // Get employee number from request
    const { employeeNo } = await request.json();
    
    if (!employeeNo) {
      return NextResponse.json({ error: 'Employee number is required' }, { status: 400 });
    }
    
    // Check if employee number exists in organization chart
    const orgEntry = await prisma.organizationChart.findUnique({
      where: { employeeNo },
      include: { subordinates: true }
    });
    
    if (!orgEntry) {
      return NextResponse.json({ error: 'Employee number not found' }, { status: 404 });
    }
    
    // Determine role based on organizational structure
    let role:UserRole = "user";
    
    if (orgEntry.subordinates.length > 0) {
      role = "manager";
    }
    
    if (!orgEntry.managerNo) {
      role = "admin";
    }
    
    // Update user with employee number and role
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        employeeNo,
        role
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      role,
      message: 'Employee verification successful'
    });
    
  } catch (error) {
    console.error('Employee verification error:', error);
    return NextResponse.json({ error: 'Failed to verify employee' }, { status: 500 });
  }
}