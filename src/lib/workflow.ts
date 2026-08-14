import { retrieveRagContext } from "@/lib/graphql";
import { getOpenAI } from "@/lib/openai-client";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import type OpenAI from "openai";

export type WorkflowInput = {
  text: string;
  question: string;
  imageBase64?: string;
  imageMimeType?: string;
  systemPrompt?: string;
};

export type WorkflowResult = {
  answer: string;
  recommendations: string[];
  safety: {
    flagged: boolean;
    categories: string[];
  };
  steps: {
    sanitize: string;
    ragContext: string;
    model: string;
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

async function runSafetyCheck(client: OpenAI, content: string) {
  try {
    const moderation = await client.moderations.create({
      model: "omni-moderation-latest",
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

async function callOpenAI(
  client: OpenAI,
  text: string,
  question: string,
  ragContext: string,
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
    "## QUESTION",
    question,
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
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 900,
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

function buildRecommendations(question: string, hasImage: boolean) {
  const base = [
    "Run NLP desk for entities & sentiment",
    "Open Safety studio for red-team probes",
    "Save a preference pair in Align (RLHF)",
  ];
  if (hasImage) base.unshift("Deep-dive the image in Vision lab");
  if (/predict|forecast|trend|csv/i.test(question)) {
    base.unshift("Try Predict studio with numeric CSV");
  }
  return base.slice(0, 4);
}

/**
 * Multi-step analysis workflow:
 * 1. Sanitize  2. GraphQL RAG + OpenAI  3. Safety  4. Format + recommend
 */
export async function runAnalysisWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  const sanitized = sanitizeInput(input.text, input.question);

  if (!sanitized.question) throw new Error("A question is required.");
  if (!sanitized.text && !input.imageBase64) {
    throw new Error("Provide input text and/or an image to analyze.");
  }

  const client = getOpenAI();
  const ragContext = await retrieveRagContext(sanitized.text, sanitized.question);
  const systemPrompt = input.systemPrompt?.trim() || SYSTEM_PROMPT;

  const rawAnswer = await callOpenAI(
    client,
    sanitized.text,
    sanitized.question,
    ragContext,
    systemPrompt,
    input.imageBase64,
    input.imageMimeType
  );

  const safety = await runSafetyCheck(client, `${sanitized.question}\n${rawAnswer}`);
  const answer = formatOutput(rawAnswer);
  const recommendations = buildRecommendations(
    sanitized.question,
    Boolean(input.imageBase64)
  );

  return {
    answer,
    recommendations,
    safety: {
      flagged: safety.flagged,
      categories: safety.categories,
    },
    steps: {
      sanitize: "Input sanitized and length-capped",
      ragContext,
      model: "gpt-4o",
      safety: safety.note,
      format: "Markdown normalized for dashboard display",
    },
  };
}
