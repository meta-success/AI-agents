import { NextResponse } from "next/server";
import { runAnalysisWorkflow } from "@/lib/workflow";

export const runtime = "nodejs";
export const maxDuration = 60;

type AgentRequestBody = {
  text?: string;
  question?: string;
  imageBase64?: string;
  imageMimeType?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AgentRequestBody;

    const text = typeof body.text === "string" ? body.text : "";
    const question = typeof body.question === "string" ? body.question : "";
    const imageBase64 =
      typeof body.imageBase64 === "string" ? body.imageBase64 : undefined;
    const imageMimeType =
      typeof body.imageMimeType === "string" ? body.imageMimeType : undefined;

    if (!question.trim()) {
      return NextResponse.json(
        { error: "Missing required field: question" },
        { status: 400 }
      );
    }

    if (!text.trim() && !imageBase64) {
      return NextResponse.json(
        { error: "Provide text and/or an image to analyze." },
        { status: 400 }
      );
    }

    const result = await runAnalysisWorkflow({
      text,
      question,
      imageBase64,
      imageMimeType,
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      meta: {
        model: result.steps.model,
        workflow: ["sanitize", "graphql_rag", "openai", "format"],
        ragContext: result.steps.ragContext,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";

    const status = message.includes("OPENAI_API_KEY") ? 503 : 500;

    return NextResponse.json({ success: false, error: message }, { status });
  }
}
