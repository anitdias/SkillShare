import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    // Check authentication and authorization
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Get form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const yearStr = formData.get("year") as string;
    const year = parseInt(yearStr);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (isNaN(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    // Read the Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json({ error: "Excel file is empty" }, { status: 400 });
    }

    // Validate the data structure
    const requiredColumns = [
        'Form Name', 
        'Question Number', 
        'Question asked', 
        'Question Type', 
        'Choice 1', 
        'Choice 2', 
        'Choice 3', 
        'Choice 4'
      ];
  
      const firstRow = data[0] as Record<string, string | number>;
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
  
      if (missingColumns.length > 0) {
        return NextResponse.json({ 
          error: `Missing required columns: ${missingColumns.join(', ')}` 
        }, { status: 400 });
      }
  
      // Process and save the data
      const questions: {
        formName: string;
        questionNumber: number;
        questionText: string;
        questionType: string;
        choice1: string | null;
        choice2: string | null;
        choice3: string | null;
        choice4: string | null;
        year: number;
        original: boolean;
      }[] = [];
      
      for (const row of data) {
        const typedRow = row as Record<string, string | number | null>;
        
        // Validate question type
        const questionType = typedRow['Question Type'];
      if (questionType !== 'Multiple Choice' && questionType !== 'Check Boxes') {
        return NextResponse.json({ 
          error: `Invalid Question Type: ${questionType}. Must be either "Multiple Choice" or "Check Boxes"` 
        }, { status: 400 });
      }
      
      // Create the question object
      const question = {
        formName: typedRow['Form Name'] as string,
        questionNumber: typeof typedRow['Question Number'] === 'string' 
          ? parseInt(typedRow['Question Number']) 
          : typeof typedRow['Question Number'] === 'number'
            ? typedRow['Question Number']
            : 0,
        questionText: typedRow['Question asked'] as string,
        questionType: questionType,
        choice1: typedRow['Choice 1'] !== null && typedRow['Choice 1'] !== undefined 
          ? String(typedRow['Choice 1']) 
          : null,
        choice2: typedRow['Choice 2'] !== null && typedRow['Choice 2'] !== undefined 
          ? String(typedRow['Choice 2']) 
          : null,
        choice3: typedRow['Choice 3'] !== null && typedRow['Choice 3'] !== undefined 
          ? String(typedRow['Choice 3']) 
          : null,
        choice4: typedRow['Choice 4'] !== null && typedRow['Choice 4'] !== undefined 
          ? String(typedRow['Choice 4']) 
          : null,
        year,
        original: true
      };
      
      questions.push(question);
    }

    // Save to database
    const result = await prisma.$transaction(async (tx) => {
        // First, delete all existing questions for the selected year
        await tx.feedbackQuestion.deleteMany({
          where: {
            year: year
          }
        });
        
        // Then create all new questions
        const createdQuestions = await Promise.all(
          questions.map(question => 
            tx.feedbackQuestion.create({
              data: question
            })
          )
        );
        
        return createdQuestions.length;
      });
  
      return NextResponse.json({ 
        success: true, 
        questionsAdded: result 
      });
    
  } catch (error) {
    console.error("Error processing feedback questions upload:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "An unknown error occurred" 
    }, { status: 500 });
  }
}