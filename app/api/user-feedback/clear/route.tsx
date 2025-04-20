import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// DELETE: Clear all feedback data for a user and year
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = request.nextUrl.searchParams.get('userId');
    const yearParam = request.nextUrl.searchParams.get('year');
    
    if (!userId || !yearParam) {
      return NextResponse.json({ error: 'Missing required parameters: userId and year' }, { status: 400 });
    }
    
    const year = parseInt(yearParam);
    
    if (isNaN(year)) {
      return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
    }
    
    console.log(`Clearing feedback data for user ${userId} and year ${year}`);
    
    // Find all user feedback entries for this user and year
    const userFeedbackEntries = await prisma.userFeedback.findMany({
      where: {
        targetUserId: userId,
        year: year,
      },
      include: {
        feedbackReviewers: {
          include: {
            feedbackResponses: true,
          },
        },
      },
    });
    
    console.log(`Found ${userFeedbackEntries.length} feedback entries to delete`);
    
    // Delete all related data in the correct order to maintain referential integrity
    for (const feedback of userFeedbackEntries) {
      // Delete all feedback responses for each reviewer
      for (const reviewer of feedback.feedbackReviewers) {
        if (reviewer.feedbackResponses && reviewer.feedbackResponses.length > 0) {
          await prisma.feedbackResponse.deleteMany({
            where: {
              feedbackReviewerId: reviewer.id,
            },
          });
        }
      }
      
      // Delete all feedback reviewers
      if (feedback.feedbackReviewers && feedback.feedbackReviewers.length > 0) {
        await prisma.feedbackReviewer.deleteMany({
          where: {
            userFeedbackId: feedback.id,
          },
        });
      }
    }
    
    // Delete all user feedback entries
    const deletedCount = await prisma.userFeedback.deleteMany({
      where: {
        targetUserId: userId,
        year: year,
      },
    });
    
    console.log(`Deleted ${deletedCount.count} user feedback entries`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${deletedCount.count} feedback entries and all associated data` 
    });
    
  } catch (error) {
    console.error('Error clearing feedback data:', error);
    return NextResponse.json({ 
      error: 'Failed to clear feedback data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}