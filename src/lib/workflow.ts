import OpenAI from "openai";
import { retrieveRagContext } from "@/lib/graphql";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export type WorkflowInput = {
  text: string;
  question: string;
  imageBase64?: string;
  imageMimeType?: string;
};

export type WorkflowResult = {
  answer: string;
  steps: {
    sanitize: string;
    ragContext: string;
    model: string;
  };
};

/** Step 1 — Sanitize user input */
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

/** Step 2 — Call OpenAI (gpt-4o) with RAG context */
async function callOpenAI(
  text: string,
  question: string,
  ragContext: string,
  imageBase64?: string,
  imageMimeType?: string
) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to your environment variables.");
  }

  const client = new OpenAI({ apiKey });

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
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) {
    throw new Error("The model returned an empty response.");
  }

  return answer;
}

/** Step 3 — Format output for the dashboard */
function formatOutput(raw: string) {
  return raw.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Multi-step analysis workflow:
 * 1. Sanitize input
 * 2. Retrieve GraphQL RAG context + call OpenAI
 * 3. Format the output for the user
 */
export async function runAnalysisWorkflow(input: WorkflowInput): Promise<WorkflowResult> {
  const sanitized = sanitizeInput(input.text, input.question);

  if (!sanitized.question) {
    throw new Error("A question is required.");
  }

  if (!sanitized.text && !input.imageBase64) {
    throw new Error("Provide input text and/or an image to analyze.");
  }

  const ragContext = await retrieveRagContext(sanitized.text, sanitized.question);

  const rawAnswer = await callOpenAI(
    sanitized.text,
    sanitized.question,
    ragContext,
    input.imageBase64,
    input.imageMimeType
  );

  const answer = formatOutput(rawAnswer);

  return {
    answer,
    steps: {
      sanitize: "Input sanitized and length-capped",
      ragContext,
      model: "gpt-4o",
    },
  };
}
