import { Mistral } from "@mistralai/mistralai";
import { NextRequest, NextResponse } from "next/server";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { text, systemPrompt } = await request.json();

    if (!text || !systemPrompt) {
      return NextResponse.json(
        { error: "Missing text or systemPrompt" },
        { status: 400 }
      );
    }

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Please analyze the following article draft and provide your feedback:\n\n---\n${text}\n---`,
        },
      ],
      responseFormat: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Empty response from Mistral" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Mistral API error:", error);
    return NextResponse.json(
      { error: "Failed to get feedback from AI" },
      { status: 500 }
    );
  }
}
