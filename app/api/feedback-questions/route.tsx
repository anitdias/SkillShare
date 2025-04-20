import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET: Fetch feedback questions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    const formName = searchParams.get('formName');
    
    // Build query with proper typing
    const query: { year: number; formName?: string } = { year };
    if (formName) query.formName = formName;
    
    const questions = await prisma.feedbackQuestion.findMany({
      where: query,
      orderBy: { questionNumber: 'asc' },
    });
    
    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching feedback questions:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback questions' }, { status: 500 });
  }
}

// POST: Create a new feedback question
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.questionText || !data.questionType || !data.formName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Set default values
    const year = data.year || new Date().getFullYear();
    
    // By default, questions added through the admin interface should NOT be original
    // Only questions imported from Excel should be marked as original
    const original = false;
    
    // Get the highest question number for this form and year
    const highestQuestion = await prisma.feedbackQuestion.findFirst({
      where: { formName: data.formName, year },
      orderBy: { questionNumber: 'desc' },
    });
    
    const questionNumber = highestQuestion ? highestQuestion.questionNumber + 1 : 1;
    
    // Create the question
    const question = await prisma.feedbackQuestion.create({
      data: {
        formName: data.formName,
        questionNumber,
        questionText: data.questionText,
        questionType: data.questionType,
        choice1: data.choice1 || null,
        choice2: data.choice2 || null,
        choice3: data.choice3 || null,
        choice4: data.choice4 || null,
        year,
        original, // Always false for admin-added questions
      },
    });
    
    return NextResponse.json(question);
  } catch (error) {
    console.error('Error creating feedback question:', error);
    return NextResponse.json({ error: 'Failed to create feedback question' }, { status: 500 });
  }
}

// PUT: Update a feedback question (creates a new customized version)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.questionText || !data.questionType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the original question
    const originalQuestion = await prisma.feedbackQuestion.findUnique({
      where: { id: data.id },
    });
    
    if (!originalQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }
    
    // Create a new customized question based on the original
    const customizedQuestion = await prisma.feedbackQuestion.create({
      data: {
        formName: originalQuestion.formName,
        questionNumber: originalQuestion.questionNumber,
        questionText: data.questionText,
        questionType: data.questionType,
        choice1: data.choice1 || null,
        choice2: data.choice2 || null,
        choice3: data.choice3 || null,
        choice4: data.choice4 || null,
        year: originalQuestion.year,
        original: false, // Mark as customized
      },
    });
    
    return NextResponse.json(customizedQuestion);
  } catch (error) {
    console.error('Error updating feedback question:', error);
    return NextResponse.json({ error: 'Failed to update feedback question' }, { status: 500 });
  }
}

// DELETE: Delete a feedback question
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
    }
    
    // Check if the question is used in any user feedback
    const usedInFeedback = await prisma.userFeedback.findFirst({
      where: { feedbackQuestionId: data.id },
    });
    
    if (usedInFeedback) {
      return NextResponse.json({ 
        error: 'Cannot delete question that is assigned to users. Remove the assignments first.' 
      }, { status: 400 });
    }
    
    // Delete the question
    await prisma.feedbackQuestion.delete({
      where: { id: data.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback question:', error);
    return NextResponse.json({ error: 'Failed to delete feedback question' }, { status: 500 });
  }
}