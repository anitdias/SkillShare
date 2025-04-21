import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET: Fetch feedback reviewers
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userFeedbackId = searchParams.get('userFeedbackId');
    const reviewerId = searchParams.get('reviewerId');
    
    // Build query with proper typing
    const query: { 
      userFeedbackId?: string; 
      reviewerId?: string;
    } = {};
    if (userFeedbackId) query.userFeedbackId = userFeedbackId;
    if (reviewerId) query.reviewerId = reviewerId;
    
    // For regular users, only show their assigned reviews
    if (session.user.role !== 'admin') {
      query.reviewerId = session.user.id;
    }
    
    const reviewers = await prisma.feedbackReviewer.findMany({
      where: query,
      include: {
        userFeedback: {
          include: {
            feedbackQuestion: true,
          },
        },
      },
    });
    
    return NextResponse.json(reviewers);
  } catch (error) {
    console.error('Error fetching feedback reviewers:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback reviewers' }, { status: 500 });
  }
}

// POST: Assign reviewers to user feedback
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.userId || !data.reviewerIds || !Array.isArray(data.reviewerIds) || data.reviewerIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get user feedback for this user and year
    const userFeedback = await prisma.userFeedback.findMany({
      where: {
        targetUserId: data.userId,
        year: data.year || new Date().getFullYear(),
      },
    });
    
    if (userFeedback.length === 0) {
      return NextResponse.json({ error: 'No feedback found for this user' }, { status: 404 });
    }
    
    // Fetch all existing reviewer assignments in a single query
    const existingReviewers = await prisma.feedbackReviewer.findMany({
      where: {
        userFeedbackId: {
          in: userFeedback.map(feedback => feedback.id)
        },
        reviewerId: {
          in: data.reviewerIds
        }
      },
      select: {
        userFeedbackId: true,
        reviewerId: true
      }
    });
    
    // Create a lookup map for quick checking
    const existingAssignments = new Map();
    existingReviewers.forEach(reviewer => {
      const key = `${reviewer.userFeedbackId}_${reviewer.reviewerId}`;
      existingAssignments.set(key, true);
    });
    
    // Fetch missing reviewer names in a single query if needed
    const reviewerNamesMap = data.reviewerNames ? { ...data.reviewerNames } : {};
    const missingReviewerIds = data.reviewerIds.filter((id: string) => !reviewerNamesMap[id]);
    
    if (missingReviewerIds.length > 0) {
      const reviewers = await prisma.user.findMany({
        where: {
          id: {
            in: missingReviewerIds
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      reviewers.forEach(reviewer => {
        reviewerNamesMap[reviewer.id] = reviewer.name || 'Unknown Reviewer';
      });
    }
    
    // Prepare batch create data
    const createData = [];
    
    for (const feedback of userFeedback) {
      for (const reviewerId of data.reviewerIds) {
        const key = `${feedback.id}_${reviewerId}`;
        
        // Skip if already assigned
        if (!existingAssignments.has(key)) {
          createData.push({
            userFeedbackId: feedback.id,
            reviewerId,
            reviewerName: reviewerNamesMap[reviewerId] || 'Unknown Reviewer',
            status: 'PENDING',
          });
        }
      }
    }
    
    // Batch create all new assignments in a single operation
    
    if (createData.length > 0) {
      await prisma.feedbackReviewer.createMany({
        data: createData,
        skipDuplicates: true,
      });
    }
    
    return NextResponse.json({ count: createData.length });
  } catch (error) {
    console.error('Error assigning reviewers:', error);
    return NextResponse.json({ error: 'Failed to assign reviewers' }, { status: 500 });
  }
}

// DELETE: Remove a reviewer
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Reviewer ID is required' }, { status: 400 });
    }
    
    // Delete the reviewer
    await prisma.feedbackReviewer.delete({
      where: { id: data.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting reviewer:', error);
    return NextResponse.json({ error: 'Failed to delete reviewer' }, { status: 500 });
  }
}