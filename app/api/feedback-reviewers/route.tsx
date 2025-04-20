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
      
      // Create reviewer assignments
      const reviewerPromises = [];
      
      for (const feedback of userFeedback) {
        for (const reviewerId of data.reviewerIds) {
          // Check if this reviewer is already assigned to this feedback
          const existingReviewer = await prisma.feedbackReviewer.findFirst({
            where: {
              userFeedbackId: feedback.id,
              reviewerId,
            },
          });
          
          // Get reviewer name from the data or fetch from database
          let reviewerName = data.reviewerNames?.[reviewerId];
          
          // If name not provided, try to fetch from database
          if (!reviewerName) {
            const reviewer = await prisma.user.findUnique({
              where: { id: reviewerId },
              select: { name: true }
            });
            reviewerName = reviewer?.name || 'Unknown Reviewer';
          }
          
          if (!existingReviewer) {
            reviewerPromises.push(
              prisma.feedbackReviewer.create({
                data: {
                  userFeedbackId: feedback.id,
                  reviewerId,
                  reviewerName, // Store the reviewer name
                  status: 'PENDING',
                },
              })
            );
          }
        }
      }
      
      const results = await Promise.all(reviewerPromises);
      
      return NextResponse.json(results);
    } catch (error) {
      console.error('Error assigning reviewers:', error);
      return NextResponse.json({ error: 'Failed to assign reviewers' }, { status: 500 });
    }
  }

// PATCH: Update reviewer status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.id || !data.status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the reviewer
    const reviewer = await prisma.feedbackReviewer.findUnique({
      where: { id: data.id },
    });
    
    if (!reviewer) {
      return NextResponse.json({ error: 'Reviewer not found' }, { status: 404 });
    }
    
    // Only allow admins or the assigned reviewer to update
    if (session.user.role !== 'admin' && reviewer.reviewerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Update the reviewer
    const updatedReviewer = await prisma.feedbackReviewer.update({
      where: { id: data.id },
      data: { status: data.status },
    });
    
    return NextResponse.json(updatedReviewer);
  } catch (error) {
    console.error('Error updating reviewer:', error);
    return NextResponse.json({ error: 'Failed to update reviewer' }, { status: 500 });
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