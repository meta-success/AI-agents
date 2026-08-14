import { getOpenAI, jsonError, resolveModel } from "@/lib/openai-client";
import { CHAT_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export async function POST(request: Request) {
  try {
    const { messages } = (await request.json()) as { messages?: Msg[] };
    if (!messages?.length) return jsonError("messages are required", 400);

    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: resolveModel("gpt-4o-mini"),
      temperature: 0.5,
      max_tokens: 500,
      messages: [{ role: "system", content: CHAT_PROMPT }, ...messages],
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) return jsonError("Empty chat reply");

    return Response.json({
      success: true,
      reply,
      skill: "Conversational AI / Chatbots",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Chat failed");
  }
}
