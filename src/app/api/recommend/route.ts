import { chatText, jsonError } from "@/lib/openai-client";
import { RECOMMEND_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { context } = (await request.json()) as { context?: string };
    if (!context?.trim()) return jsonError("context is required", 400);

    const raw = await chatText(RECOMMEND_PROMPT, context, {
      model: "gpt-4o-mini",
      temperature: 0.4,
    });

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return Response.json({
      success: true,
      ...parsed,
      skill: "Recommendation Systems",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Recommend failed");
  }
}
