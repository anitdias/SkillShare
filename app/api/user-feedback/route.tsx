import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET: Fetch user feedback
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Fetch user feedback with related data
    const userFeedback = await prisma.userFeedback.findMany({
      where: {
        targetUserId: userId,
        year,
      },
      include: {
        feedbackQuestion: true,
        feedbackReviewers: true,
      },
      orderBy: {
        feedbackQuestion: {
          questionNumber: 'asc',
        },
      },
    });
    
    return NextResponse.json(userFeedback);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch user feedback' }, { status: 500 });
  }
}

// POST: Create user feedback (assign questions to a user)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.userId || !data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const year = data.year || new Date().getFullYear();
    
    // Get the form name from the first question
    const firstQuestion = await prisma.feedbackQuestion.findUnique({
      where: { id: data.questions[0] },
    });
    
    if (!firstQuestion) {
      return NextResponse.json({ error: 'Invalid question ID' }, { status: 400 });
    }
    
    const formName = firstQuestion.formName;
    
    // Create user feedback entries for each question
    const userFeedbackPromises = data.questions.map((questionId: string) => {
      return prisma.userFeedback.create({
        data: {
          targetUserId: data.userId,
          feedbackQuestionId: questionId,
          formName,
          year,
          status: 'PENDING',
        },
      });
    });
    
    const results = await Promise.all(userFeedbackPromises);
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error creating user feedback:', error);
    return NextResponse.json({ error: 'Failed to create user feedback' }, { status: 500 });
  }
}

// PATCH: Update user feedback
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.id) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }
    
    // Update the user feedback
    const updatedFeedback = await prisma.userFeedback.update({
      where: { id: data.id },
      data: {
        feedbackQuestionId: data.feedbackQuestionId,
        status: data.status,
      },
    });
    
    return NextResponse.json(updatedFeedback);
  } catch (error) {
    console.error('Error updating user feedback:', error);
    return NextResponse.json({ error: 'Failed to update user feedback' }, { status: 500 });
  }
}

// DELETE: Delete user feedback
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Feedback ID is required' }, { status: 400 });
    }
    
    // First delete any associated reviewers
    await prisma.feedbackReviewer.deleteMany({
      where: { userFeedbackId: data.id },
    });
    
    // Then delete the feedback
    await prisma.userFeedback.delete({
      where: { id: data.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user feedback:', error);
    return NextResponse.json({ error: 'Failed to delete user feedback' }, { status: 500 });
  }
}