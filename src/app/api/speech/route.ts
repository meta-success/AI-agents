import { getOpenAI, jsonError, resolveModel } from "@/lib/openai-client";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "transcribe" | "speak";
      audioBase64?: string;
      audioMimeType?: string;
      text?: string;
      voice?: string;
    };

    const client = getOpenAI();

    if (body.mode === "speak") {
      if (!body.text?.trim()) return jsonError("text is required for TTS", 400);
      const speech = await client.audio.speech.create({
        model: resolveModel("tts-1"),
        voice: (body.voice as "alloy") || "alloy",
        input: body.text.slice(0, 2000),
      });
      const buffer = Buffer.from(await speech.arrayBuffer());
      return Response.json({
        success: true,
        audioBase64: buffer.toString("base64"),
        mimeType: "audio/mpeg",
        skill: "Audio & Speech / Generative AI",
      });
    }

    if (!body.audioBase64) return jsonError("audioBase64 is required", 400);

    const mime = body.audioMimeType || "audio/webm";
    const bytes = Buffer.from(body.audioBase64, "base64");
    const file = new File([bytes], "speech.webm", { type: mime });

    const transcription = await client.audio.transcriptions.create({
      file,
      model: resolveModel("whisper-1"),
    });

    return Response.json({
      success: true,
      text: transcription.text,
      skill: "Audio & Speech",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Speech failed");
  }
}
