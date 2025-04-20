import { NextResponse } from 'next/server';
import  prisma  from '@/lib/prisma';

export async function GET() {
  try {

    // Get distinct years from feedback questions
    const feedbackYears = await prisma.feedbackQuestion.findMany({
      select: {
        year: true,
      },
      distinct: ['year'],
      orderBy: {
        year: 'desc',
      },
    });

    // Extract years into an array
    const years = feedbackYears.map(item => item.year);
    
    // If no years found, include current year
    if (years.length === 0) {
      years.push(new Date().getFullYear());
    }

    return NextResponse.json(years);
  } catch (error) {
    console.error('Error fetching feedback years:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback years' }, { status: 500 });
  }
}