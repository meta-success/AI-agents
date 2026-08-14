import { chatText, jsonError } from "@/lib/openai-client";
import { NLP_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { text } = (await request.json()) as { text?: string };
    if (!text?.trim()) return jsonError("text is required", 400);

    const raw = await chatText(NLP_PROMPT, text, {
      model: "gpt-4o-mini",
      temperature: 0.1,
    });

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return Response.json({ success: true, nlp: parsed, skill: "Natural Language Processing" });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "NLP failed");
  }
}
