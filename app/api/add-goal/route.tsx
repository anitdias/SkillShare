import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, goalName, goalTitle, metric, weightage, goalCategory, year } = body;

    // Validate required fields
    if (!userId || !goalName || !goalTitle || !metric || !weightage || !goalCategory) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // First, create the goal
    const goal = await prisma.goal.create({
      data: {
        goalName: goalName,
        goalTitle: goalTitle,
        metric: metric,
        weightage: parseInt(weightage),
        goalCategory: goalCategory,
        year: year || 2024,
      },
    });

    // Then, create the user-goal association
    const userGoal = await prisma.userGoal.create({
      data: {
        userId: userId,
        goalId: goal.id,
        employeeRating: 0,
        managerRating: 0,
        adminRating: 0,
      },
    });

    return NextResponse.json({ goal, userGoal }, { status: 201 });
  } catch (error) {
    console.error('Error adding goal:', error);
    return NextResponse.json({ error: 'Failed to add goal' }, { status: 500 });
  }
}