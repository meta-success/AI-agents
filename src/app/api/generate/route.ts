import type { ImagesResponse } from "openai/resources/images";
import {
  formatApiError,
  getAiProvider,
  getOpenAI,
  jsonError,
} from "@/lib/openai-client";

export const runtime = "nodejs";
export const maxDuration = 90;

type Size = "1024x1024" | "1024x1536" | "1536x1024" | "512x512" | "256x256";

/** Models to try in order — gpt-image-1 is available on modern OpenAI accounts. */
function imageModelCandidates() {
  const provider = getAiProvider();
  if (provider === "openrouter") {
    return [
      process.env.OPENROUTER_IMAGE_MODEL,
      "openai/gpt-image-1",
      "openai/dall-e-3",
      "openai/dall-e-2",
    ].filter(Boolean) as string[];
  }
  return [
    process.env.OPENAI_IMAGE_MODEL,
    "gpt-image-1",
    "dall-e-3",
    "dall-e-2",
  ].filter(Boolean) as string[];
}

function sizeForModel(model: string, preferred?: Size): Size {
  if (preferred) return preferred;
  if (model.includes("dall-e-2")) return "512x512";
  return "1024x1024";
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
    const { prompt, size } = (await request.json()) as {
      prompt?: string;
      size?: Size;
    };

    if (!prompt?.trim()) return jsonError("prompt is required", 400);

    const client = getOpenAI();
    const models = imageModelCandidates();
    const errors: string[] = [];
    const started = Date.now();

    for (const model of models) {
      const canvas = sizeForModel(model, size);
      try {
        const result = (await client.images.generate({
          model,
          prompt: prompt.slice(0, 1000),
          size: canvas,
          n: 1,
        })) as ImagesResponse;

        const { url, revised } = pickUrl(result);
        if (!url) {
          errors.push(`${model}: empty image payload`);
          continue;
        }

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
        errors.push(`${model}: ${message}`);

        // Auth / quota — stop immediately
        if (/401|403|429|quota|billing|auth|api key/i.test(message)) {
          return jsonError(message, 503);
        }

        // Model missing / bad params — try next candidate
        if (
          /does not exist|not found|unknown parameter|unsupported|invalid|404|400/i.test(
            message
          )
        ) {
          continue;
        }

        return jsonError(message);
      }
    }

    return jsonError(
      `Image generation failed. Tried: ${models.join(", ")}. ${errors.at(-1) || ""}`.trim(),
      400
    );
  } catch (error) {
    return jsonError(formatApiError(error));
  }
}
