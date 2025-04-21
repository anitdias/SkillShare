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
    
    // Get all userFeedback IDs first (more efficient than loading all data)
    const userFeedbackIds = await prisma.userFeedback.findMany({
      where: {
        targetUserId: userId,
        year: year,
      },
      select: {
        id: true,
      },
    });
    
    const feedbackIds = userFeedbackIds.map(feedback => feedback.id);
    console.log(`Found ${feedbackIds.length} feedback entries to delete`);
    
    if (feedbackIds.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No feedback entries found to delete' 
      });
    }
    
    // Get all reviewer IDs for these feedback entries
    const reviewerIds = await prisma.feedbackReviewer.findMany({
      where: {
        userFeedbackId: {
          in: feedbackIds,
        },
      },
      select: {
        id: true,
      },
    });
    
    const reviewerIdList = reviewerIds.map(reviewer => reviewer.id);
    
    // Use a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all feedback responses in a single batch operation
      if (reviewerIdList.length > 0) {
        await tx.feedbackResponse.deleteMany({
          where: {
            feedbackReviewerId: {
              in: reviewerIdList,
            },
          },
        });
      }
      
      // 2. Delete all feedback reviewers in a single batch operation
      if (feedbackIds.length > 0) {
        await tx.feedbackReviewer.deleteMany({
          where: {
            userFeedbackId: {
              in: feedbackIds,
            },
          },
        });
      }
      
      // 3. Delete all user feedback entries in a single batch operation
      const deletedCount = await tx.userFeedback.deleteMany({
        where: {
          id: {
            in: feedbackIds,
          },
        },
      });
      
      return deletedCount;
    }, {
      timeout: 30000, // 30 second timeout for the transaction
    });
    
    console.log(`Deleted ${result.count} user feedback entries`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${result.count} feedback entries and all associated data` 
    });
    
  } catch (error) {
    console.error('Error clearing feedback data:', error);
    return NextResponse.json({ 
      error: 'Failed to clear feedback data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}