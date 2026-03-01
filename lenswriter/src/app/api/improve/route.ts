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
        ? "\n\nIMPORTANT: Write your entire response in French."
        : "";

    const systemPrompt = `${persona}

You previously reviewed an article and gave it a score of ${feedback.approval_score}/10.
Your disagreements were: ${feedback.key_disagreements.join("; ")}.
Your summary was: "${feedback.perspective_summary}".

Now the writer is asking you: how can they improve their article to score higher with you? Give 2-4 concise, actionable suggestions. Be specific — reference parts of their text and explain exactly what to change or add. Keep your tone constructive and direct.${langInstruction}`;

    const response = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Here is my article draft. How can I improve my score with you?\n\n---\n${text}\n---`,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "Empty response from Mistral" },
        { status: 502 }
      );
    }

    return NextResponse.json({ suggestions: content });
  } catch (error) {
    console.error("Mistral API error:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions from AI" },
      { status: 500 }
    );
  }
}
