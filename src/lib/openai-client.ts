import OpenAI from "openai";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to your environment variables.");
  }
  return new OpenAI({ apiKey });
}

export async function chatText(
  system: string,
  user: string,
  options?: { model?: string; temperature?: number; maxTokens?: number }
) {
  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: options?.model ?? "gpt-4o",
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
  return Response.json(
    { success: false, error: message },
    { status: message.includes("OPENAI_API_KEY") ? 503 : status }
  );
}
