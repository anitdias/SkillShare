import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET: Fetch feedback responses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const feedbackReviewerId = searchParams.get('feedbackReviewerId');
    const userId = searchParams.get('userId');
    const year = searchParams.get('year');
    
    // If userId and year are provided, fetch all responses for that user's feedback
    if (userId && year) {
      // Only admins can fetch all responses for a user
      if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Get all user feedback for this user and year
      const userFeedback = await prisma.userFeedback.findMany({
        where: { 
          targetUserId: userId,
          year: parseInt(year)
        },
        include: {
          feedbackReviewers: true
        }
      });
      
      // Get all reviewer IDs
      const reviewerIds = userFeedback
        .flatMap(feedback => feedback.feedbackReviewers)
        .map(reviewer => reviewer.id);
      
      // Fetch all responses for these reviewers
      const responses = await prisma.feedbackResponse.findMany({
        where: {
          feedbackReviewerId: {
            in: reviewerIds
          }
        }
      });
      
      // Create a map of reviewer ID to response
      const responseMap: Record<string, { responseText: string, responseValue: number | null, id: string }> = {};
      
      responses.forEach(response => {
        responseMap[response.feedbackReviewerId] = {
          responseText: response.responseText,
          responseValue: response.responseValue,
          id: response.id
        };
      });
      
      return NextResponse.json(responseMap);
    }
    
    // Original single reviewer response logic
    if (feedbackReviewerId) {
      // Get the reviewer to check permissions
      const reviewer = await prisma.feedbackReviewer.findUnique({
        where: { id: feedbackReviewerId },
      });
      
      if (!reviewer) {
        return NextResponse.json({ error: 'Reviewer not found' }, { status: 404 });
      }
      
      // Only allow admins or the assigned reviewer to view responses
      if (session.user.role !== 'admin' && reviewer.reviewerId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // Fetch the response (we expect only one per reviewer)
      const response = await prisma.feedbackResponse.findFirst({
        where: { feedbackReviewerId },
      });
      
      if (!response) {
        return NextResponse.json({ responseText: "" }, { status: 200 });
      }
      
      // Return a structured response with the responseText property
      return NextResponse.json({ 
        responseText: response.responseText,
        responseValue: response.responseValue,
        id: response.id
      });
    }
    
    return NextResponse.json({ error: 'Either feedbackReviewerId or userId+year must be provided' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback responses' }, { status: 500 });
  }
}

// POST: Submit feedback response
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.feedbackReviewerId || !data.responseText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the reviewer
    const reviewer = await prisma.feedbackReviewer.findUnique({
      where: { id: data.feedbackReviewerId },
      include: {
        userFeedback: true,
      },
    });
    
    if (!reviewer) {
      return NextResponse.json({ error: 'Reviewer not found' }, { status: 404 });
    }
    
    // Only allow the assigned reviewer to submit a response
    if (reviewer.reviewerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if a response already exists
    const existingResponse = await prisma.feedbackResponse.findFirst({
      where: { feedbackReviewerId: data.feedbackReviewerId },
    });
    
    if (existingResponse) {
      // Update existing response
      const updatedResponse = await prisma.feedbackResponse.update({
        where: { id: existingResponse.id },
        data: {
          responseText: data.responseText,
          responseValue: data.responseValue || null,
        },
      });
      
      return NextResponse.json(updatedResponse);
    } else {
      // Create new response
      const newResponse = await prisma.feedbackResponse.create({
        data: {
          feedbackReviewerId: data.feedbackReviewerId,
          responseText: data.responseText,
          responseValue: data.responseValue || null,
        },
      });
      
      // Update reviewer status
      await prisma.feedbackReviewer.update({
        where: { id: data.feedbackReviewerId },
        data: { status: 'COMPLETED' },
      });
      
      // Check if all reviewers have completed their feedback
      const allReviewers = await prisma.feedbackReviewer.findMany({
        where: { userFeedbackId: reviewer.userFeedbackId },
      });
      
      const allCompleted = allReviewers.every(r => r.status === 'COMPLETED');
      
      if (allCompleted) {
        // Update user feedback status
        await prisma.userFeedback.update({
          where: { id: reviewer.userFeedbackId },
          data: { status: 'COMPLETED' },
        });
      }
      
      // Create notification for the target user
      await prisma.notification.create({
        data: {
          userId: reviewer.userFeedback.targetUserId,
          title: 'New Feedback Response',
          message: 'Someone has submitted feedback for you',
          type: 'FEEDBACK_RESPONSE',
          relatedId: reviewer.userFeedbackId,
        },
      });
      
      return NextResponse.json(newResponse);
    }
  } catch (error) {
    console.error('Error submitting feedback response:', error);
    return NextResponse.json({ error: 'Failed to submit feedback response' }, { status: 500 });
  }
}

// DELETE: Delete feedback response (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    if (!data.id) {
      return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
    }
    
    // Delete the response
    await prisma.feedbackResponse.delete({
      where: { id: data.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feedback response:', error);
    return NextResponse.json({ error: 'Failed to delete feedback response' }, { status: 500 });
  }
}