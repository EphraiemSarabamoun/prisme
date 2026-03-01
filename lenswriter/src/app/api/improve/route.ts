import { Mistral } from "@mistralai/mistralai";
import { NextRequest, NextResponse } from "next/server";

const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { text, persona, feedback, lang } = await request.json();

    if (!text || !persona || !feedback) {
      return NextResponse.json(
        { error: "Missing text, persona, or feedback" },
        { status: 400 }
      );
    }

    const langInstruction =
      lang === "fr"
        ? " Keep the article in its original language (French if it was French)."
        : "";

    const systemPrompt = `${persona}

You previously reviewed an article and gave it a score of ${feedback.approval_score}/10.
Your disagreements were: ${feedback.key_disagreements.join("; ")}.
Your summary was: "${feedback.perspective_summary}".

The writer wants you to make minor edits to their article so it scores higher with you. Rules:
- Make SMALL, targeted changes — adjust wording, add a short clause, or reframe a sentence.
- Do NOT rewrite the entire article. Keep as much of the original text intact as possible.
- Do NOT add commentary, explanations, or markdown. Return ONLY the revised article text.${langInstruction}`;

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is my article. Please return a lightly revised version:\n\n${text}`,
        },
      ],
      temperature: 0.4,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Empty response from Mistral" },
        { status: 502 }
      );
    }

    return NextResponse.json({ revisedText: content.trim() });
  } catch (error) {
    console.error("Mistral API error:", error);
    return NextResponse.json(
      { error: "Failed to get revisions from AI" },
      { status: 500 }
    );
  }
}
