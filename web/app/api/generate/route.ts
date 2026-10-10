
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { product } = await request.json();

    if (typeof product !== "string" || !product.trim()) {
      return NextResponse.json(
        { error: "Please enter a product idea." },
        { status: 400 }
      );
    }

    if (product.length > 5000) {
      return NextResponse.json(
        { error: "Please keep your product idea under 5000 characters." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing from .env.local." },
        { status: 500 }
      );
    }

    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          temperature: 0.2,
          max_completion_tokens: 5000,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content: `You are ProductOS, an AI product manager and QA analyst.
Analyze the user's product idea and return valid JSON only.
Use these exact top-level keys:
productName, problemStatement, targetPersonas, features, userStories, assumptions, testCases.

Structure:
- productName: string
- problemStatement: string
- targetPersonas: array of objects with name and needs
- features: array of objects with name, priority (Must have, Should have, Could have, or Won't have), and reason
- userStories: array of objects with id, story, acceptanceCriteria (array of strings), testable (boolean), and suggestedRewrite (string)
- assumptions: array of strings
- testCases: array of objects with id, userStoryId, title, steps (array of strings), and expectedResult

Create useful, specific requirements and realistic test cases.
Link each test case to a relevant user story using userStoryId.
Include measurable acceptance criteria where possible.
Flag unclear or untestable stories and suggest a clearer rewrite.
Use MoSCoW priorities for features.
Do not invent research, statistics, or regulatory facts.
If details are missing, state reasonable assumptions.
Return JSON only, with no markdown fences.`,
            },
            {
              role: "user",
              content: `Analyze this product idea:\n\n${product.trim()}`,
            },
          ],
        }),
      }
    );

    if (!groqResponse.ok) {
      const details = await groqResponse.text();
      console.error("Groq API error:", details);

      return NextResponse.json(
        { error: "Groq could not generate the analysis. Please try again." },
        { status: 502 }
      );
    }

    const result = await groqResponse.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Groq returned an empty response. Please try again." },
        { status: 502 }
      );
    }

    const analysis = JSON.parse(content);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("ProductOS generation error:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating requirements." },
      { status: 500 }
    );
  }
}
