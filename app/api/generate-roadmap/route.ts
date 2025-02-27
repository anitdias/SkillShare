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

    const prompt =`As a highly experienced mentor and domain expert, create a structured, 
    step-by-step learning roadmap for mastering ${skillName}, tailored to a ${level} learner. 
    Present the roadmap in a JSON-like format, strictly adhering to the following structure with nothing else but the following structure(do not put any other header as it will cause parsing issue):

    {
  "roadmap": {
      "steps": [
        {
          "label": "Step 1 Name",
          "description": "Detailed and very long step by step explanation of what this step entails with examples(as a paragraph).",
          "resources": [
            "Resource 1",
            "Resource 2"
            etc...
          ],
          "timeline": "Realistic time estimate for completing this step.",
          "challenges": [
            "Key challenge 1",
            "Key challenge 2"
            ,
            etc...
          ],
          "outcome": "Measurable outcome or skill mastered by completing this step."
        },
        {
          "label": "Step 2 Name",
          "description": "Detailed and very long step by step explanation of what this step entails with examples(as a paragraph).",
          "resources": [
            "Resource 1",
            "Resource 2"
            etc...
          ],
          "timeline": "Realistic time estimate for completing this step.",
          "challenges": [
            "Key challenge 1",
            "Key challenge 2"
            ,
            etc...
          ],
          "outcome": "Measurable outcome or skill mastered by completing this step."
        },
        {
          "label": "Step 3 Name",
          "description": "Detailed and very long step by step explanation of what this step entails with examples(as a paragraph).",
          "resources": [
            "Resource 1",
            "Resource 2"
            etc...
          ],
          "timeline": "Realistic time estimate for completing this step.",
          "challenges": [
            "Key challenge 1",
            "Key challenge 2"
            ,
            etc...
          ],
          "outcome": "Measurable outcome or skill mastered by completing this step."
        }
          and so on...
      ]
    }
  }

Divide the roadmap into clear steps each with a descriptive label.
Include a list of steps, ensuring each step has the following fields:
label: A short name for the step (used as the node label).
description: A detailed and very long step by step explanation of what this step entails with examples(as a paragraph).
resources: Specific resources (books, courses, websites, tools, or communities) for this step.
timeline: A realistic time estimate for completing this step.
challenges: Key challenges learners may face at this step and strategies to overcome them.
outcome: A measurable outcome or skill mastered by completing this step.
Ensure the roadmap is comprehensive, tailored to the learner's level, and 
supports interactive visualization by following this exact structure. 
Strictly return all content in this JSON-like format for easy node mapping 
and click-based exploration.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    const roadmapText = response.choices[0]?.message?.content ?? "";
    if (!roadmapText) {
      return NextResponse.json({ error: "Failed to generate roadmap. No content from OpenAI." }, { status: 500 });
    }
    console.log("Generated roadmap:", roadmapText);
    return NextResponse.json({ roadmapText });
  } catch (error) {
    console.error("Error generating roadmap:", error);
    return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
  }
}


