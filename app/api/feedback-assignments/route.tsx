import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET: Fetch feedback assignments with target user names
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const reviewerId = searchParams.get('reviewerId');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : new Date().getFullYear();
    
    if (!reviewerId) {
      return NextResponse.json({ error: 'Reviewer ID is required' }, { status: 400 });
    }
    
    // Fetch feedback assignments with related data including target user information
    const assignments = await prisma.feedbackReviewer.findMany({
      where: {
        reviewerId: reviewerId,
        userFeedback: {
          year: year
        }
      },
      include: {
        userFeedback: {
          include: {
            feedbackQuestion: true
          }
        }
      },
    });
    
    // Get unique target user IDs
    const targetUserIds = [...new Set(assignments.map(a => a.userFeedback.targetUserId))];
    
    // Fetch user names for all target users
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: targetUserIds
        }
      },
      select: {
        id: true,
        name: true
      }
    });
    
    // Create a map of user IDs to names
    const userNameMap = new Map(users.map(user => [user.id, user.name]));
    
    // Enhance assignments with target user names
    const enhancedAssignments = assignments.map(assignment => {
      return {
        ...assignment,
        userFeedback: {
          ...assignment.userFeedback,
          targetUserName: userNameMap.get(assignment.userFeedback.targetUserId) || null
        }
      };
    });
    
    return NextResponse.json(enhancedAssignments);
  } catch (error) {
    console.error('Error fetching feedback assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback assignments' }, { status: 500 });
  }
}