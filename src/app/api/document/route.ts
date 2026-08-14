import { chatText, jsonError } from "@/lib/openai-client";
import { DOCUMENT_PROMPT } from "@/lib/prompts";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { text, filename } = (await request.json()) as {
      text?: string;
      filename?: string;
    };

    if (!text?.trim()) return jsonError("Document text is required", 400);

    const chunks = chunkText(text, 800);
    const raw = await chatText(
      DOCUMENT_PROMPT,
      `Filename: ${filename || "document"}\n\n${text.slice(0, 10000)}`,
      { model: "gpt-4o-mini", temperature: 0.1 }
    );

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const extracted = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));

    return Response.json({
      success: true,
      extracted,
      ragChunks: chunks.slice(0, 6),
      skill: "Document AI & Extraction / RAG Systems",
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Document AI failed");
  }
}

function chunkText(text: string, size: number) {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks;
}
