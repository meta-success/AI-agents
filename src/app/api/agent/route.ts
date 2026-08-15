import { NextResponse } from "next/server";
import { formatApiError } from "@/lib/openai-client";
import { runAnalysisWorkflow } from "@/lib/workflow";

export const runtime = "nodejs";
export const maxDuration = 90;

type AgentRequestBody = {
  text?: string;
  question?: string;
  imageBase64?: string;
  imageMimeType?: string;
  systemPrompt?: string;
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
    const systemPrompt =
      typeof body.systemPrompt === "string" ? body.systemPrompt : undefined;

    if (!question.trim()) {
      return NextResponse.json(
        { success: false, error: "Missing required field: question" },
        { status: 400 }
      );
    }

    if (!text.trim() && !imageBase64) {
      return NextResponse.json(
        { success: false, error: "Provide text and/or an image to analyze." },
        { status: 400 }
      );
    }

    const result = await runAnalysisWorkflow({
      text,
      question,
      imageBase64,
      imageMimeType,
      systemPrompt,
    });

    return NextResponse.json({
      success: true,
      answer: result.answer,
      recommendations: result.recommendations,
      safety: result.safety,
      nlp: result.nlp,
      document: result.document,
      visionUsed: result.visionUsed,
      suggestedLabel: result.suggestedLabel,
      meta: {
        model: result.steps.model,
        workflow: [
          "sanitize",
          "graphql_rag",
          "nlp",
          "document_ai",
          "multimodal_agent",
          "safety",
          "format",
        ],
        ragContext: result.steps.ragContext,
        steps: result.steps,
      },
    });
  } catch (error) {
    const message = formatApiError(error);
    const status =
      /API key|auth failed \(401\)|OPENAI_API_KEY|OPENROUTER_API_KEY/i.test(message)
        ? 503
        : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "nexus-agent",
    mlops: {
      runtime: "nodejs",
      model: "gpt-4o",
      pipeline: [
        "sanitize",
        "graphql_rag",
        "nlp",
        "document_ai",
        "multimodal_agent",
        "safety",
        "format",
      ],
      deployedAt: new Date().toISOString(),
    },
  });
}
