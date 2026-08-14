import { getOpenAI, jsonError, resolveModel } from "@/lib/openai-client";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: Request) {
  try {
    const { prompt, size } = (await request.json()) as {
      prompt?: string;
      size?: "1024x1024" | "1024x1536" | "1536x1024";
    };

    if (!prompt?.trim()) return jsonError("prompt is required", 400);

    const client = getOpenAI();
    const result = await client.images.generate({
      model: resolveModel("dall-e-3"),
      prompt: prompt.slice(0, 3000),
      size: size || "1024x1024",
      n: 1,
    });

    const url = result.data?.[0]?.url;
    const revised = result.data?.[0]?.revised_prompt;

    if (!url) return jsonError("Image generation returned no URL");

    return Response.json({
      success: true,
      url,
      revisedPrompt: revised,
      skill: "Generative AI (Image/Video/Audio)",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Generate failed");
  }
}
