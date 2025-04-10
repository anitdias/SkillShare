import prisma from "../../../../lib/prisma";
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import _ from 'lodash';
import { UserRole } from '@prisma/client';

export async function POST(request: Request) {
  try {
    // Parse the incoming JSON request
    const { name, email, password, employeeNo } = await request.json();

    // Validate input
    if (!name || !email || !password || !employeeNo) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { name },
          { employeeNo }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists with this email, username, or employee number' },
        { status: 400 }
      );
    }

    // Check if employee number exists in organization chart
    const orgEntry = await prisma.organizationChart.findUnique({
      where: { employeeNo },
      include: { subordinates: true }
    });

    if (!orgEntry) {
      return NextResponse.json(
        { message: 'Employee number not found in organization chart' },
        { status: 400 }
      );
    }

    // Determine role based on organizational structure
    let role: UserRole = 'user';
    
    // Check if user has subordinates (manager)
    if (orgEntry.subordinates.length > 0) {
      role = 'manager';
    }
    
    // Check if user is top-level manager (admin)
    if (!orgEntry.managerNo) {
      role = 'admin';
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role and employee number
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        employeeNo,
        role,
      },
    });

    // Remove sensitive data before sending response
    const userWithoutPassword = _.omit(user, ['passwordHash']);

    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: userWithoutPassword,
        role 
      },
      { status: 201 }
    );
  } catch (error) {
    // Log the error properly
    if (error instanceof Error) {
      console.error('Signup error:', error.message);
    } else {
      console.error('Signup error:', error);
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
