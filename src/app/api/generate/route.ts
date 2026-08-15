import type { ImagesResponse } from "openai/resources/images";
import {
  formatApiError,
  getAiProvider,
  getOpenAI,
  jsonError,
} from "@/lib/openai-client";

export const runtime = "nodejs";
export const maxDuration = 60;

type Size = "1024x1024" | "512x512" | "256x256";

function primaryImageModel() {
  const provider = getAiProvider();
  if (provider === "openrouter") {
    return process.env.OPENROUTER_IMAGE_MODEL || "openai/dall-e-2";
  }
  return process.env.OPENAI_IMAGE_MODEL || "dall-e-2";
}

function pickUrl(result: ImagesResponse) {
  const item = result.data?.[0];
  return {
    url:
      item?.url ||
      (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null),
    revised: item?.revised_prompt,
  };
}

export async function POST(request: Request) {
  try {
    const { prompt, size, fast } = (await request.json()) as {
      prompt?: string;
      size?: Size;
      fast?: boolean;
    };

    if (!prompt?.trim()) return jsonError("prompt is required", 400);

    const client = getOpenAI();
    const model = primaryImageModel();
    const useFast = fast !== false;
    const canvas: Size =
      size ||
      (useFast && model.includes("dall-e-2") ? "512x512" : "1024x1024");

    const started = Date.now();

    try {
      const result = (await client.images.generate({
        model,
        prompt: prompt.slice(0, 1000),
        size: canvas,
        n: 1,
        response_format: "url",
      })) as ImagesResponse;

      const { url, revised } = pickUrl(result);
      if (!url) return jsonError("Image generation returned an empty payload");

      return Response.json({
        success: true,
        url,
        revisedPrompt: revised,
        model,
        size: canvas,
        latencyMs: Date.now() - started,
        skill: "Generative AI (Image/Video/Audio)",
      });
    } catch (error) {
      const message = formatApiError(error);
      if (!/does not exist|not found|unsupported|404|400/i.test(message)) {
        return jsonError(
          message,
          /401|403|429|quota|billing/i.test(message) ? 503 : 500
        );
      }

      const fallback =
        getAiProvider() === "openrouter" ? "openai/dall-e-2" : "dall-e-2";
      if (fallback === model) return jsonError(message, 400);

      const result = (await client.images.generate({
        model: fallback,
        prompt: prompt.slice(0, 1000),
        size: "512x512",
        n: 1,
        response_format: "url",
      })) as ImagesResponse;

      const { url, revised } = pickUrl(result);
      if (!url) return jsonError(message, 400);

      return Response.json({
        success: true,
        url,
        revisedPrompt: revised,
        model: fallback,
        size: "512x512",
        latencyMs: Date.now() - started,
        skill: "Generative AI (Image/Video/Audio)",
      });
    }
  } catch (error) {
    return jsonError(formatApiError(error));
  }
}
