"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  Bot,
  ImagePlus,
  Loader2,
  Sparkles,
  Trash2,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type AgentResponse = {
  success: boolean;
  answer?: string;
  error?: string;
  meta?: {
    model: string;
    workflow: string[];
    ragContext: string;
  };
};

export default function Home() {
  const [text, setText] = useState("");
  const [question, setQuestion] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function clearImage() {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onImageChange(file: File | null) {
    if (!file) {
      clearImage();
      return;
    }

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

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          question,
          imageBase64: imageBase64 ?? undefined,
          imageMimeType: imageMimeType ?? undefined,
        }),
      });

      const data = (await response.json()) as AgentResponse;
      setResult(data);
    } catch {
      setResult({
        success: false,
        error: "Network error — could not reach the agent API.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-full overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.08),_transparent_45%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <header className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-teal-400/15 ring-1 ring-teal-300/30">
              <Bot className="size-5 text-teal-300" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white">
                Nexus Agent
              </p>
              <p className="text-xs text-zinc-400">Smart AI Agent Dashboard</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-teal-400/30 text-teal-200">
              gpt-4o
            </Badge>
            <Badge variant="outline" className="border-sky-400/30 text-sky-200">
              GraphQL RAG
            </Badge>
            <Badge variant="outline" className="hidden border-zinc-500/40 text-zinc-300 sm:inline-flex">
              Workflow
            </Badge>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <section className="space-y-3">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Analyze context. Ask anything.
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Paste source material, optionally attach an image, and let the multimodal
            agent retrieve GraphQL context, run a 3-step workflow, and return a
            structured answer.
          </p>
        </section>

        <form onSubmit={onAnalyze} className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-0 bg-zinc-900/70 ring-white/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-white">
                <Sparkles className="size-4 text-teal-300" />
                Input Data
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Source text used as RAG context for the agent.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste documents, notes, or any text you want the agent to reason over…"
                className="min-h-44 border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-500"
              />

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">Ask a Question</label>
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What should the agent figure out?"
                  required
                  className="h-10 border-white/10 bg-black/30 text-zinc-100 placeholder:text-zinc-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-200">
                  Image (optional)
                </label>
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
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-zinc-400 hover:text-white"
                      onClick={clearImage}
                    >
                      <Trash2 className="size-4" />
                      Remove
                    </Button>
                  )}
                </div>
                {imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="mt-2 max-h-40 rounded-lg object-contain ring-1 ring-white/10"
                  />
                )}
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
            </CardContent>
          </Card>

          <Card className="border-0 bg-zinc-900/70 ring-white/10 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base text-white">Agent Output</CardTitle>
              <CardDescription className="text-zinc-400">
                Structured response from the analysis workflow.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!result && !loading && (
                <p className="rounded-lg border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center text-sm text-zinc-500">
                  Results will appear here after you run Analyze.
                </p>
              )}

              {loading && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-4 py-12">
                  <Loader2 className="size-8 animate-spin text-teal-300" />
                  <p className="text-sm text-zinc-400">
                    Running sanitize → GraphQL RAG → gpt-4o…
                  </p>
                </div>
              )}

              {result?.success === false && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {result.error}
                </div>
              )}

              {result?.success && result.answer && (
                <div className="space-y-4">
                  <div className="prose prose-invert max-w-none whitespace-pre-wrap rounded-lg border border-white/10 bg-black/30 p-4 text-sm leading-relaxed text-zinc-200">
                    {result.answer}
                  </div>

                  {result.meta && (
                    <>
                      <Separator className="bg-white/10" />
                      <div className="space-y-2 text-xs text-zinc-400">
                        <p>
                          <span className="text-zinc-300">Model:</span>{" "}
                          {result.meta.model}
                        </p>
                        <p>
                          <span className="text-zinc-300">Workflow:</span>{" "}
                          {result.meta.workflow.join(" → ")}
                        </p>
                        <details className="rounded-md border border-white/10 bg-black/20 p-3">
                          <summary className="cursor-pointer text-zinc-300">
                            GraphQL RAG context
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] text-zinc-400">
                            {result.meta.ragContext}
                          </pre>
                        </details>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}
