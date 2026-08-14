import { getOpenAI, jsonError, resolveModel } from "@/lib/openai-client";
import { VISION_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      imageBase64?: string;
      imageMimeType?: string;
      question?: string;
    };

    if (!body.imageBase64 || !body.imageMimeType) {
      return jsonError("imageBase64 and imageMimeType are required", 400);
    }

    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: resolveModel("gpt-4o"),
      temperature: 0.2,
      max_tokens: 900,
      messages: [
        { role: "system", content: VISION_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: body.question?.trim() || "Analyze this image thoroughly.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${body.imageMimeType};base64,${body.imageBase64}`,
              },
            },
          ],
        },
      ],
    });

    const analysis = completion.choices[0]?.message?.content?.trim();
    if (!analysis) return jsonError("Empty vision response");

    return Response.json({
      success: true,
      analysis,
      skill: "Computer Vision",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Vision failed");
  }
}
