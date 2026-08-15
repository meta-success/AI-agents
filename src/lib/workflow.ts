import { retrieveRagContext } from "@/lib/graphql";
import { chatText, getOpenAI, resolveModel } from "@/lib/openai-client";
import {
  DOCUMENT_PROMPT,
  NLP_PROMPT,
  SYSTEM_PROMPT,
} from "@/lib/prompts";
import type OpenAI from "openai";

export type WorkflowInput = {
  text: string;
  question: string;
  imageBase64?: string;
  imageMimeType?: string;
  systemPrompt?: string;
};

export type NlpBundle = {
  sentiment: string;
  sentimentConfidence: number;
  entities: { text: string; type: string }[];
  keywords: string[];
  summary: string;
};

export type DocBundle = {
  title: string;
  summary: string;
  entities: { label: string; value: string }[];
  actionItems: string[];
  dates: string[];
};

export type WorkflowResult = {
  answer: string;
  recommendations: string[];
  safety: {
    flagged: boolean;
    categories: string[];
    note: string;
  };
  nlp: NlpBundle | null;
  document: DocBundle | null;
  visionUsed: boolean;
  suggestedLabel: string | null;
  steps: {
    sanitize: string;
    ragContext: string;
    model: string;
    nlp: string;
    document: string;
    safety: string;
    format: string;
  };
};

function sanitizeInput(text: string, question: string) {
  const clean = (value: string) =>
    value
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .trim()
      .slice(0, 12_000);

  return {
    text: clean(text),
    question: clean(question),
  };
}

function parseJsonObject<T>(raw: string): T | null {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end < 0) return null;
    return JSON.parse(raw.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

async function runSafetyCheck(client: OpenAI, content: string) {
  try {
    const moderation = await client.moderations.create({
      model: resolveModel("moderation"),
      input: content.slice(0, 8000),
    });
    const result = moderation.results[0];
    const categories = Object.entries(result?.categories ?? {})
      .filter(([, v]) => v)
      .map(([k]) => k);
    return {
      flagged: Boolean(result?.flagged),
      categories,
      note: result?.flagged
        ? "Moderation flagged risk categories"
        : "Moderation clear",
    };
  } catch {
    return {
      flagged: false,
      categories: [] as string[],
      note: "Moderation skipped (API unavailable)",
    };
  }
}

async function runNlp(text: string): Promise<NlpBundle | null> {
  if (!text.trim()) return null;
  try {
    const raw = await chatText(NLP_PROMPT, text.slice(0, 6000), {
      model: "gpt-4o-mini",
      temperature: 0.1,
      maxTokens: 500,
    });
    return parseJsonObject<NlpBundle>(raw);
  } catch {
    return null;
  }
}

async function runDocumentExtract(text: string): Promise<DocBundle | null> {
  if (!text.trim() || text.trim().length < 40) return null;
  try {
    const raw = await chatText(DOCUMENT_PROMPT, text.slice(0, 8000), {
      model: "gpt-4o-mini",
      temperature: 0.1,
      maxTokens: 600,
    });
    return parseJsonObject<DocBundle>(raw);
  } catch {
    return null;
  }
}

async function callOpenAI(
  client: OpenAI,
  text: string,
  question: string,
  ragContext: string,
  nlp: NlpBundle | null,
  document: DocBundle | null,
  systemPrompt: string,
  imageBase64?: string,
  imageMimeType?: string
) {
  const userText = [
    "## INPUT DATA (RAG context from the user)",
    text || "(no text provided)",
    "",
    "## RETRIEVED CONTEXT (GraphQL)",
    ragContext,
    "",
    "## NLP PRE-ANALYSIS",
    nlp ? JSON.stringify(nlp, null, 2) : "(skipped — no text)",
    "",
    "## DOCUMENT EXTRACTION",
    document ? JSON.stringify(document, null, 2) : "(skipped)",
    "",
    "## QUESTION",
    question,
    "",
    "Use the NLP + document extraction above as supporting evidence. If an image is attached, include visual findings.",
  ].join("\n");

  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: userText },
  ];

  if (imageBase64 && imageMimeType) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${imageMimeType};base64,${imageBase64}`,
      },
    });
  }

  const completion = await client.chat.completions.create({
    model: resolveModel("gpt-4o"),
    temperature: 0.3,
    max_tokens: 1000,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) throw new Error("The model returned an empty response.");
  return answer;
}

function formatOutput(raw: string) {
  return raw.replace(/\n{3,}/g, "\n\n").trim();
}

function buildRecommendations(
  question: string,
  hasImage: boolean,
  nlp: NlpBundle | null,
  safetyFlagged: boolean
) {
  const items: string[] = [];
  if (hasImage) items.push("Open Vision studio for a deeper OCR / object pass");
  if (nlp?.sentiment === "negative") {
    items.push("Save this sample in Annotate as label: negative");
  } else if (nlp?.sentiment === "positive") {
    items.push("Save this sample in Annotate as label: positive");
  } else {
    items.push("Label this sample in Annotate for fine-tuning");
  }
  if (safetyFlagged) {
    items.push("Run Safety studio for red-team probes on this content");
  } else {
    items.push("Rate the answer in Align (RLHF thumbs)");
  }
  if (/predict|forecast|trend|csv|revenue|sales/i.test(question)) {
    items.push("Try Predict studio with numeric CSV for forecasting");
  }
  items.push("Export training JSONL from Fine-tune after labeling");
  return [...new Set(items)].slice(0, 5);
}

/**
 * Unified analysis workflow:
 * sanitize → (RAG + NLP + Document AI in parallel) → multimodal agent → safety → format
 */
export async function runAnalysisWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  const sanitized = sanitizeInput(input.text, input.question);

  if (!sanitized.question) throw new Error("A question is required.");
  if (!sanitized.text && !input.imageBase64) {
    throw new Error("Provide input text and/or an image to analyze.");
  }

  const client = getOpenAI();
  const systemPrompt = input.systemPrompt?.trim() || SYSTEM_PROMPT;
  const visionUsed = Boolean(input.imageBase64 && input.imageMimeType);

  const [ragContext, nlp, document] = await Promise.all([
    retrieveRagContext(sanitized.text, sanitized.question),
    runNlp(sanitized.text),
    runDocumentExtract(sanitized.text),
  ]);

  const rawAnswer = await callOpenAI(
    client,
    sanitized.text,
    sanitized.question,
    ragContext,
    nlp,
    document,
    systemPrompt,
    input.imageBase64,
    input.imageMimeType
  );

  const safety = await runSafetyCheck(
    client,
    `${sanitized.text}\n${sanitized.question}\n${rawAnswer}`
  );
  const answer = formatOutput(rawAnswer);
  const recommendations = buildRecommendations(
    sanitized.question,
    visionUsed,
    nlp,
    safety.flagged
  );

  const suggestedLabel =
    nlp?.sentiment === "positive" ||
    nlp?.sentiment === "negative" ||
    nlp?.sentiment === "neutral"
      ? nlp.sentiment
      : null;

  return {
    answer,
    recommendations,
    safety: {
      flagged: safety.flagged,
      categories: safety.categories,
      note: safety.note,
    },
    nlp,
    document,
    visionUsed,
    suggestedLabel,
    steps: {
      sanitize: "Input sanitized and length-capped",
      ragContext,
      model: resolveModel("gpt-4o"),
      nlp: nlp ? `Sentiment ${nlp.sentiment}` : "NLP skipped",
      document: document ? `Extracted: ${document.title || "untitled"}` : "Document AI skipped",
      safety: safety.note,
      format: "Markdown normalized for dashboard display",
    },
  };
}
