"use client";

import { useRef, useState, type FormEvent } from "react";
import { ImagePlus, Loader2, ThumbsDown, ThumbsUp, Trash2, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { saveFeedback } from "@/lib/local-data";
import {
  EmptyState,
  ErrorBox,
  FieldLabel,
  LoadingBlock,
  Panel,
  ResultBox,
} from "@/components/dashboard/ui-bits";

type AgentResponse = {
  success: boolean;
  answer?: string;
  error?: string;
  recommendations?: string[];
  safety?: { flagged: boolean; categories: string[] };
  meta?: {
    model: string;
    workflow: string[];
    ragContext: string;
    steps: Record<string, string>;
  };
};

export function AgentStudio() {
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT);
  const [showPrompt, setShowPrompt] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [feedbackNote, setFeedbackNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onImageChange(file: File | null) {
    if (!file) return clearImage();
    if (!file.type.startsWith("image/")) {
      setResult({ success: false, error: "Please upload an image file." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const [, payload = ""] = dataUrl.split(",");
      setImagePreview(dataUrl);
      setImageBase64(payload);
      setImageMimeType(file.type);
    };
    reader.readAsDataURL(file);
  }

  async function onAnalyze(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setFeedbackNote(null);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          question,
          systemPrompt,
          imageBase64: imageBase64 ?? undefined,
          imageMimeType: imageMimeType ?? undefined,
        }),
      });
      setResult((await response.json()) as AgentResponse);
    } catch {
      setResult({ success: false, error: "Network error — could not reach the agent API." });
    } finally {
      setLoading(false);
    }
  }

  function rate(rating: "up" | "down") {
    if (!result?.answer) return;
    saveFeedback({ response: result.answer, rating });
    setFeedbackNote(rating === "up" ? "Thanks — positive RLHF signal saved." : "Thanks — negative RLHF signal saved.");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Analyze context. Ask anything.
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          Multimodal agent with editable prompts, GraphQL RAG, safety checks, and
          recommendation follow-ups — proving agents, RAG, workflow, APIs, and more.
        </p>
      </div>

      <form onSubmit={onAnalyze} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Input Data"
          description="Source material used as RAG context for the agent."
        >
          <div className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste documents, notes, or any text you want the agent to reason over…"
              className="min-h-40 border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-500"
            />

            <div>
              <FieldLabel>Ask a Question</FieldLabel>
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What should the agent figure out?"
                required
                className="h-10 border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <div>
              <FieldLabel>Image (optional)</FieldLabel>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Upload image
                </Button>
                {imagePreview ? (
                  <Button type="button" variant="ghost" className="text-zinc-400" onClick={clearImage}>
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                ) : null}
              </div>
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="mt-3 max-h-40 rounded-xl object-contain ring-1 ring-white/10"
                />
              ) : null}
            </div>

            <div>
              <button
                type="button"
                className="text-xs font-medium text-teal-300 hover:text-teal-200"
                onClick={() => setShowPrompt((v) => !v)}
              >
                {showPrompt ? "Hide" : "Edit"} system prompt (Prompt Engineering)
              </button>
              {showPrompt ? (
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="mt-2 min-h-36 border-white/10 bg-black/30 font-mono text-xs text-zinc-300"
                />
              ) : null}
            </div>

            <Button
              type="submit"
              size="lg"
              disabled={loading || !question.trim()}
              className="h-11 w-full bg-teal-400 text-zinc-950 hover:bg-teal-300"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Workflow className="size-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </Panel>

        <Panel title="Agent Output" description="Structured response from the analysis workflow.">
          {!result && !loading ? <EmptyState label="Results will appear here after you run Analyze." /> : null}
          {loading ? <LoadingBlock label="sanitize → GraphQL RAG → gpt-4o → safety → format" /> : null}
          {result?.success === false ? <ErrorBox message={result.error || "Request failed"} /> : null}

          {result?.success && result.answer ? (
            <div className="space-y-4">
              <ResultBox>{result.answer}</ResultBox>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" className="border-white/15" onClick={() => rate("up")}>
                  <ThumbsUp className="size-3.5" /> Helpful
                </Button>
                <Button type="button" variant="outline" size="sm" className="border-white/15" onClick={() => rate("down")}>
                  <ThumbsDown className="size-3.5" /> Needs work
                </Button>
              </div>
              {feedbackNote ? <p className="text-xs text-teal-300">{feedbackNote}</p> : null}

              {result.recommendations?.length ? (
                <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Recommendations
                  </p>
                  <ul className="space-y-1.5 text-sm text-zinc-300">
                    {result.recommendations.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.meta ? (
                <>
                  <Separator className="bg-white/10" />
                  <div className="space-y-2 text-xs text-zinc-400">
                    <p>
                      <span className="text-zinc-300">Model:</span> {result.meta.model}
                    </p>
                    <p>
                      <span className="text-zinc-300">Workflow:</span>{" "}
                      {result.meta.workflow.join(" → ")}
                    </p>
                    {result.safety ? (
                      <p>
                        <span className="text-zinc-300">Safety:</span>{" "}
                        {result.safety.flagged
                          ? `flagged (${result.safety.categories.join(", ") || "categories"})`
                          : "clear"}
                      </p>
                    ) : null}
                    <details className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <summary className="cursor-pointer text-zinc-300">GraphQL RAG context</summary>
                      <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-zinc-500">
                        {result.meta.ragContext}
                      </pre>
                    </details>
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </form>
    </div>
  );
}
