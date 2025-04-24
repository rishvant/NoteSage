// app/api/summarize/route.ts
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

// This is required for API routes that use dynamic features like request.json()
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that creates concise summaries of text. Keep summaries brief and focused on key points.",
        },
        {
          role: "user",
          content: `Please summarize the following note in a concise way:\n\n${content}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 150,
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json(
        { error: "No summary generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error("Summarization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to summarize note" },
      { status: 500 }
    );
  }
}
