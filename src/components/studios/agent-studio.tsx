"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  FileUp,
  ImagePlus,
  Loader2,
  Shield,
  Sparkles,
  Tags,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { saveAnnotation, saveFeedback } from "@/lib/local-data";
import {
  EmptyState,
  ErrorBox,
  FieldLabel,
  LoadingBlock,
  Panel,
  ResultBox,
} from "@/components/dashboard/ui-bits";
import { cn } from "@/lib/utils";

type NlpBundle = {
  sentiment: string;
  sentimentConfidence: number;
  entities: { text: string; type: string }[];
  keywords: string[];
  summary: string;
};

type DocBundle = {
  title: string;
  summary: string;
  entities: { label: string; value: string }[];
  actionItems: string[];
  dates: string[];
};

type AgentResponse = {
  success: boolean;
  answer?: string;
  error?: string;
  recommendations?: string[];
  safety?: { flagged: boolean; categories: string[]; note?: string };
  nlp?: NlpBundle | null;
  document?: DocBundle | null;
  visionUsed?: boolean;
  suggestedLabel?: string | null;
  meta?: {
    model: string;
    workflow: string[];
    ragContext: string;
    steps: Record<string, string>;
  };
};

type OutputTab = "answer" | "nlp" | "docs" | "safety" | "pipeline";

const PIPELINE = [
  "Sanitize",
  "GraphQL RAG",
  "NLP",
  "Document AI",
  "Vision",
  "Agent",
  "Safety",
];

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
  const [tab, setTab] = useState<OutputTab>("answer");
  const fileRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);

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

  async function onDocChange(file: File | null) {
    if (!file) return;
    const content = await file.text();
    setText((prev) => (prev ? `${prev}\n\n---\n${file.name}\n${content}` : content));
  }

  async function onAnalyze(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setFeedbackNote(null);
    setTab("answer");
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
      setResult({
        success: false,
        error: "Network error — could not reach the agent API.",
      });
    } finally {
      setLoading(false);
    }
  }

  function rate(rating: "up" | "down") {
    if (!result?.answer) return;
    saveFeedback({ response: result.answer, rating });
    setFeedbackNote(
      rating === "up"
        ? "Saved to Align → Agent thumbs feedback."
        : "Saved negative RLHF signal to Align."
    );
  }

  function saveLabel() {
    if (!text.trim()) return;
    const label = result?.suggestedLabel || result?.nlp?.sentiment || "unlabeled";
    saveAnnotation({
      text: text.trim().slice(0, 2000),
      label,
      notes: question || undefined,
    });
    setFeedbackNote(`Annotation saved with label “${label}” (see Annotate).`);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-400/15 bg-gradient-to-br from-cyan-400/10 via-zinc-900/40 to-transparent p-6 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 size-40 rounded-full bg-cyan-400/20 blur-3xl nexus-glow-pulse"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
              Unified analysis agent
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Analyze context. Ask anything.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              One Analyze run combines RAG, NLP, Document AI, vision, safety, and
              recommendations — then you can save labels / RLHF feedback without leaving Agent.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE.map((step) => (
                <span
                  key={step}
                  className="rounded-full border border-cyan-400/20 bg-cyan-400/5 px-2.5 py-1 text-[11px] text-cyan-100/80"
                >
                  {step}
                </span>
              ))}
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascot.png"
            alt="Nexus Agent"
            className="mx-auto h-28 w-28 rounded-3xl object-cover object-top ring-2 ring-cyan-300/40 shadow-[0_0_40px_rgba(34,211,238,0.35)] sm:mx-0 sm:h-32 sm:w-32"
          />
        </div>
      </div>

      <form onSubmit={onAnalyze} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel
          title="Input Data"
          description="Text, docs, and images feed one unified analysis pipeline."
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

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel>Document (optional)</FieldLabel>
                <input
                  ref={docRef}
                  type="file"
                  accept=".txt,.md,.csv,.json,.log"
                  className="hidden"
                  onChange={(e) => onDocChange(e.target.files?.[0] ?? null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                  onClick={() => docRef.current?.click()}
                >
                  <FileUp className="size-4" />
                  Attach text file
                </Button>
              </div>
              <div>
                <FieldLabel>Image (optional)</FieldLabel>
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
                  className="w-full border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="size-4" />
                  Upload image
                </Button>
              </div>
            </div>

            {imagePreview ? (
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Upload preview"
                  className="max-h-36 rounded-xl object-contain ring-1 ring-white/10"
                />
                <Button type="button" variant="ghost" className="text-zinc-400" onClick={clearImage}>
                  <Trash2 className="size-4" />
                  Remove
                </Button>
              </div>
            ) : null}

            <div>
              <button
                type="button"
                className="text-xs font-medium text-cyan-300 hover:text-cyan-200"
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
              className="h-11 w-full bg-cyan-300 text-zinc-950 shadow-[0_0_28px_rgba(34,211,238,0.35)] hover:bg-cyan-200"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Running full pipeline…
                </>
              ) : (
                <>
                  <Workflow className="size-4" />
                  Analyze everything
                </>
              )}
            </Button>
          </div>
        </Panel>

        <Panel title="Agent Output" description="Answer plus NLP, docs, safety, and next steps.">
          {!result && !loading ? (
            <EmptyState label="Results will appear here after you run Analyze." />
          ) : null}
          {loading ? (
            <LoadingBlock label="sanitize → RAG + NLP + Docs → agent → safety" />
          ) : null}
          {result?.success === false ? (
            <ErrorBox message={result.error || "Request failed"} />
          ) : null}

          {result?.success && result.answer ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["answer", "Answer"],
                    ["nlp", "NLP"],
                    ["docs", "Docs"],
                    ["safety", "Safety"],
                    ["pipeline", "Pipeline"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                      tab === id
                        ? "bg-cyan-300 text-zinc-950"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "answer" ? <ResultBox>{result.answer}</ResultBox> : null}

              {tab === "nlp" ? (
                result.nlp ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge className="border-0 bg-cyan-400/15 text-cyan-100">
                        {result.nlp.sentiment}
                      </Badge>
                      <Badge variant="outline" className="border-white/15 text-zinc-300">
                        conf {(result.nlp.sentimentConfidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-300">{result.nlp.summary}</p>
                    <ResultBox className="font-mono text-xs">
                      {JSON.stringify(
                        {
                          entities: result.nlp.entities,
                          keywords: result.nlp.keywords,
                        },
                        null,
                        2
                      )}
                    </ResultBox>
                  </div>
                ) : (
                  <EmptyState label="No NLP result (add text input)." />
                )
              ) : null}

              {tab === "docs" ? (
                result.document ? (
                  <ResultBox className="font-mono text-xs">
                    {JSON.stringify(result.document, null, 2)}
                  </ResultBox>
                ) : (
                  <EmptyState label="Document AI runs when input text is long enough." />
                )
              ) : null}

              {tab === "safety" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="size-4 text-cyan-300" />
                    <span className="text-zinc-200">
                      {result.safety?.flagged ? "Flagged" : "Clear"} —{" "}
                      {result.safety?.note || "checked"}
                    </span>
                  </div>
                  {result.safety?.categories?.length ? (
                    <p className="text-xs text-zinc-400">
                      Categories: {result.safety.categories.join(", ")}
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500">No risk categories triggered.</p>
                  )}
                </div>
              ) : null}

              {tab === "pipeline" && result.meta ? (
                <div className="space-y-2 text-xs text-zinc-400">
                  <p>
                    <span className="text-zinc-300">Model:</span> {result.meta.model}
                  </p>
                  <p>
                    <span className="text-zinc-300">Workflow:</span>{" "}
                    {result.meta.workflow.join(" → ")}
                  </p>
                  <p>
                    <span className="text-zinc-300">Vision:</span>{" "}
                    {result.visionUsed ? "included" : "not used"}
                  </p>
                  <details className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <summary className="cursor-pointer text-zinc-300">GraphQL RAG context</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-zinc-500">
                      {result.meta.ragContext}
                    </pre>
                  </details>
                  <details className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <summary className="cursor-pointer text-zinc-300">Step notes</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-zinc-500">
                      {JSON.stringify(result.meta.steps, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : null}

              <Separator className="bg-white/10" />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/15"
                  onClick={() => rate("up")}
                >
                  <ThumbsUp className="size-3.5" /> Helpful
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-white/15"
                  onClick={() => rate("down")}
                >
                  <ThumbsDown className="size-3.5" /> Needs work
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-cyan-400/30 text-cyan-100"
                  onClick={saveLabel}
                  disabled={!text.trim()}
                >
                  <Tags className="size-3.5" />
                  Save annotation
                </Button>
              </div>
              {feedbackNote ? <p className="text-xs text-cyan-300">{feedbackNote}</p> : null}

              {result.recommendations?.length ? (
                <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-cyan-200/80">
                    <Sparkles className="size-3.5" />
                    Recommended next steps
                  </p>
                  <ul className="space-y-1.5 text-sm text-zinc-300">
                    {result.recommendations.map((r) => (
                      <li key={r}>• {r}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </form>
    </div>
  );
}
