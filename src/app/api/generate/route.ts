import {
  formatApiError,
  getAiProvider,
  getOpenAI,
  jsonError,
} from "@/lib/openai-client";

export const runtime = "nodejs";
export const maxDuration = 90;

type Size = "1024x1024" | "1024x1536" | "1536x1024" | "512x512" | "256x256";

/** Try models in order until one works for the current provider. */
function imageModels() {
  const provider = getAiProvider();
  if (provider === "openrouter") {
    return [
      process.env.OPENROUTER_IMAGE_MODEL || "black-forest-labs/flux-1.1-pro",
      "openai/dall-e-3",
      "openai/dall-e-2",
    ];
  }
  // OpenAI: gpt-image-1 is current; fall back to DALL·E family
  return [
    process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    "dall-e-3",
    "dall-e-2",
  ];
}

function normalizeSize(model: string, size?: Size): Size {
  if (model.includes("dall-e-2")) return "1024x1024";
  if (size) return size;
  return "1024x1024";
}

export async function POST(request: Request) {
  try {
    const { prompt, size } = (await request.json()) as {
      prompt?: string;
      size?: Size;
    };

    if (!prompt?.trim()) return jsonError("prompt is required", 400);

    const client = getOpenAI();
    const models = imageModels();
    const errors: string[] = [];

    for (const model of models) {
      try {
        const result = await client.images.generate({
          model,
          prompt: prompt.slice(0, 3000),
          size: normalizeSize(model, size),
          n: 1,
        });

        const item = result.data?.[0];
        const url =
          item?.url ||
          (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null);
        const revised = item?.revised_prompt;

        if (!url) {
          errors.push(`${model}: empty image payload`);
          continue;
        }

        return Response.json({
          success: true,
          url,
          revisedPrompt: revised,
          model,
          skill: "Generative AI (Image/Video/Audio)",
        });
      } catch (error) {
        const message = formatApiError(error);
        errors.push(`${model}: ${message}`);
        // Try next model when this one is unavailable
        if (
          /does not exist|not found|not available|unsupported|404|400/i.test(
            message
          )
        ) {
          continue;
        }
        // Auth / billing — no point retrying other models
        if (/401|403|auth|api key|billing|quota|429/i.test(message)) {
          return jsonError(message, 503);
        }
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
