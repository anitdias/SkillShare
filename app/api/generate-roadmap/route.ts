import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skillName, level } = body;

    if (!skillName || !level) {
      return NextResponse.json({ error: "Skill name and level are required" }, { status: 400 });
    }

    const prompt = `As a highly experienced mentor and domain expert, create a comprehensive, step-by-step learning roadmap for mastering ${skillName} tailored to a ${level} learner. Break down the roadmap into clear phases or milestones, each with actionable steps, realistic timelines, and measurable outcomes. Provide specific resources (e.g., books, courses, websites, tools, or communities) and practical tips for each step. Ensure the roadmap incorporates best practices, challenges learners may face at this level, and strategies to overcome them. Conclude with advice on how to stay motivated and track progress effectively.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 700,
    });

    const roadmapText = response.choices[0]?.message?.content ?? "";
    if (!roadmapText) {
      return NextResponse.json({ error: "Failed to generate roadmap. No content from OpenAI." }, { status: 500 });
    }
    console.log(roadmapText)
    const roadmap = roadmapText
      .split("\n")

    return NextResponse.json({ roadmap });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
  }
}

