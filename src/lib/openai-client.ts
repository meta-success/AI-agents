import OpenAI from "openai";

export type AiProvider = "openai" | "openrouter";

function isOpenRouterKey(key?: string) {
  return Boolean(key?.startsWith("sk-or-"));
}

function isNativeOpenAIKey(key?: string) {
  return Boolean(key && !isOpenRouterKey(key) && key.startsWith("sk-"));
}

/**
 * Prefer native OpenAI when both keys exist.
 * OpenRouter only when explicitly requested or it's the only key available.
 */
export function getAiProvider(): AiProvider {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "openrouter") return "openrouter";
  if (explicit === "openai") return "openai";

  const openAiKey = process.env.OPENAI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (isNativeOpenAIKey(openAiKey)) return "openai";
  if (openRouterKey || isOpenRouterKey(openAiKey)) return "openrouter";
  return "openai";
}

function getApiKey() {
  const provider = getAiProvider();
  const key =
    provider === "openrouter"
      ? process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
      : process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error(
      "Missing API key. Set OPENAI_API_KEY in .env (or OPENROUTER_API_KEY with AI_PROVIDER=openrouter)."
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
    model: resolveModel(options?.model ?? "gpt-4o-mini"),
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 600,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error("The model returned an empty response.");
  return content;
}

/** Turn SDK / provider errors into actionable messages. */
export function formatApiError(error: unknown) {
  const provider = getAiProvider();

  if (error && typeof error === "object") {
    const e = error as {
      status?: number;
      message?: string;
      error?: { message?: string; code?: string };
    };
    const detail = e.error?.message || e.message || "Request failed";
    const status = e.status;

    if (status === 401 || /401|user not found|incorrect api key|invalid.*key/i.test(detail)) {
      if (provider === "openrouter") {
        return "OpenRouter auth failed (401). Your OpenRouter key is invalid or expired. Fix: use a valid OPENAI_API_KEY and set AI_PROVIDER=openai, or replace OPENROUTER_API_KEY.";
      }
      return "OpenAI auth failed (401). Check that OPENAI_API_KEY in .env is complete and valid, then restart the dev server.";
    }

    if (status === 429) {
      return `Rate limit hit (${provider}). Wait a moment or check your plan/credits.`;
    }

    if (status) return `${provider} error ${status}: ${detail}`;
    return detail;
  }

  return error instanceof Error ? error.message : "Unexpected API error";
}

export function jsonError(message: string, status = 500) {
  const missingKey =
    /API key|OPENAI_API_KEY|OPENROUTER_API_KEY|auth failed \(401\)/i.test(message);

  return Response.json(
    { success: false, error: message, provider: getAiProvider() },
    { status: missingKey ? 503 : status }
  );
}
