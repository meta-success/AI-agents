import OpenAI from "openai";

export type AiProvider = "openai" | "openrouter";

export function getAiProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "openrouter") return "openrouter";
  if (explicit === "openai") return "openai";

  if (process.env.OPENROUTER_API_KEY) return "openrouter";

  const key = process.env.OPENAI_API_KEY || "";
  if (key.startsWith("sk-or-")) return "openrouter";

  return "openai";
}

function getApiKey() {
  const provider = getAiProvider();
  const key =
    provider === "openrouter"
      ? process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
      : process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;

  if (!key) {
    throw new Error(
      "Missing API key. Set OPENROUTER_API_KEY (recommended) or OPENAI_API_KEY in .env"
    );
  }
  return key;
}

/** OpenAI SDK client — works with OpenAI or OpenRouter. */
export function getOpenAI() {
  const provider = getAiProvider();
  const apiKey = getApiKey();

  if (provider === "openrouter") {
    return new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Nexus Agent",
      },
    });
  }

  return new OpenAI({ apiKey });
}

/**
 * Map short model aliases to provider-specific IDs.
 * OpenRouter uses vendor-prefixed names like `openai/gpt-4o`.
 */
export function resolveModel(
  alias: "gpt-4o" | "gpt-4o-mini" | "dall-e-3" | "whisper-1" | "tts-1" | "moderation"
) {
  const provider = getAiProvider();

  if (provider === "openrouter") {
    const map = {
      "gpt-4o": process.env.OPENROUTER_MODEL || "openai/gpt-4o",
      "gpt-4o-mini": process.env.OPENROUTER_MODEL_MINI || "openai/gpt-4o-mini",
      "dall-e-3": "openai/dall-e-3",
      "whisper-1": "openai/whisper-1",
      "tts-1": "openai/tts-1",
      moderation: "openai/omni-moderation-latest",
    } as const;
    return map[alias];
  }

  const map = {
    "gpt-4o": "gpt-4o",
    "gpt-4o-mini": "gpt-4o-mini",
    "dall-e-3": "dall-e-3",
    "whisper-1": "whisper-1",
    "tts-1": "tts-1",
    moderation: "omni-moderation-latest",
  } as const;
  return map[alias];
}

export async function chatText(
  system: string,
  user: string,
  options?: {
    model?: "gpt-4o" | "gpt-4o-mini";
    temperature?: number;
    maxTokens?: number;
  }
) {
  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: resolveModel(options?.model ?? "gpt-4o"),
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 900,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("The model returned an empty response.");
  return content;
}

export function jsonError(message: string, status = 500) {
  const missingKey =
    message.includes("API key") ||
    message.includes("OPENAI_API_KEY") ||
    message.includes("OPENROUTER_API_KEY");

  return Response.json(
    { success: false, error: message },
    { status: missingKey ? 503 : status }
  );
}
