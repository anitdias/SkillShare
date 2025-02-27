import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);

      const body = await req.json();
      const { skills, wishlistSkills } = body; // Use wishlistSkills instead of wishlist
  
      if (!skills || !wishlistSkills) {
        return NextResponse.json({ error: "Skill and wishlist are required" }, { status: 400 });
      }
  
      const prompt = `I have expertise in the following skills: ${skills.join(", ")}.  
        Additionally, I plan to learn these skills in the near future: ${wishlistSkills.join(", ")} but give me skills other than what is there in this list.  

        Considering **current technology trends, industry demands, and future insights and most importantly skill gaps which are essential for me to improve**  
        (such as reports from the **World Economic Forum, emerging job market trends, and the evolving skill landscape**),  
        recommend **five new skills** that would best complement my **existing expertise and learning goals**.  

        Ensure that the recommended skills:  
        - Are relevant to my **technical background** and **learning aspirations**.  
        - Help me **future-proof** my career by aligning with high-demand skills.  
        - Cover a **diverse range** from the following categories:  
        - **Professional & Technical Skills**  
        - **Creative Skills**  
        - **Life & Physical Skills**  
        - **Social & Interpersonal Skills**  

        ### **Response Format:**  
        Provide the response in **valid JSON format** with nothing else but the following structure(do not put any other header as it will cause parsing issue):

        {
        "skills": ["skill1", "skill2", "skill3", "skill4", "skill5"],
        "summary": "A concise and short explanation of why these skills are valuable and how they align with my current expertise and aspirations."
        }
`
  
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
      });
  
      const recommendation = response.choices[0]?.message?.content ?? "";
      if (!recommendation) {
        return NextResponse.json({ error: "Failed to generate roadmap. No content from OpenAI." }, { status: 500 });
      }

      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { recommendation: recommendation }, // Ensure recommendation is stored as JSON
      });

      console.log("Generated roadmap:", recommendation);
      console.log("User recommendation updated:", updatedUser);
      return NextResponse.json({ recommendation });
    } catch (error) {
      console.error("Error generating roadmap:", error);
      return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
    }
  }
  


