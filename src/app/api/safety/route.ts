import { chatText, getOpenAI, jsonError, resolveModel } from "@/lib/openai-client";
import { SAFETY_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { text, mode } = (await request.json()) as {
      text?: string;
      mode?: "scan" | "redteam";
    };

    if (!text?.trim()) return jsonError("text is required", 400);

    const client = getOpenAI();
    const moderation = await client.moderations.create({
      model: resolveModel("moderation"),
      input: text.slice(0, 8000),
    });

    const result = moderation.results[0];
    const flaggedCategories = Object.entries(result?.categories ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k);

    let analysis = null;
    if (mode !== "scan") {
      const raw = await chatText(SAFETY_PROMPT, text, {
        model: "gpt-4o-mini",
        temperature: 0.2,
      });
      const jsonStart = raw.indexOf("{");
      const jsonEnd = raw.lastIndexOf("}");
      analysis = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    }

    return Response.json({
      success: true,
      moderation: {
        flagged: Boolean(result?.flagged),
        categories: flaggedCategories,
      },
      analysis,
      skill: "AI Safety & Red Teaming",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Safety failed");
  }
}
