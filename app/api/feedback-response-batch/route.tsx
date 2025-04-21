import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";
import prisma from '@/lib/prisma';

// GET: Fetch multiple feedback responses in a single request
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const feedbackReviewerIds = searchParams.getAll('feedbackReviewerId');
    
    if (feedbackReviewerIds.length === 0) {
      return NextResponse.json([]);
    }
    
    // Fetch all responses for these reviewers in a single query
    const responses = await prisma.feedbackResponse.findMany({
      where: {
        feedbackReviewerId: {
          in: feedbackReviewerIds
        }
      }
    });
    
    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback responses' }, { status: 500 });
  }
}

// POST: Submit multiple feedback responses in a single request
export async function POST(request: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const body = await request.json();
      const { responses } = body;
      
      if (!Array.isArray(responses) || responses.length === 0) {
        return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
      }
      
      // Process each response
      const results = await Promise.all(
        responses.map(async (response) => {
          const { feedbackReviewerId, responseText, status } = response;
          
          // Check if a response already exists
          const existingResponse = await prisma.feedbackResponse.findFirst({
            where: { feedbackReviewerId }
          });
          
          let responseResult;
          
          if (existingResponse) {
            // Update existing response
            responseResult = await prisma.feedbackResponse.update({
              where: { id: existingResponse.id },
              data: { responseText }
            });
          } else {
            // Create new response
            responseResult = await prisma.feedbackResponse.create({
              data: { feedbackReviewerId, responseText }
            });
          }
          
          // Update the reviewer status if provided
          if (status) {
            await prisma.feedbackReviewer.update({
              where: { id: feedbackReviewerId },
              data: { status }
            });
          }
          
          return responseResult;
        })
      );
      
      return NextResponse.json(results);
    } catch (error) {
      console.error('Error submitting feedback responses:', error);
      return NextResponse.json({ error: 'Failed to submit feedback responses' }, { status: 500 });
    }
  }