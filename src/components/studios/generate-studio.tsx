"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyState,
  ErrorBox,
  FieldLabel,
  Panel,
  ResultBox,
} from "@/components/dashboard/ui-bits";

const STAGES = [
  "Preparing prompt…",
  "Rendering image…",
  "Finalizing output…",
];

export function GenerateStudio() {
  const [prompt, setPrompt] = useState(
    "A cute fluffy cat with big sparkling eyes, soft neon cyan lighting, anime style"
  );
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [revised, setRevised] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const t1 = window.setTimeout(() => setStage(1), 400);
    const t2 = window.setTimeout(() => setStage(2), 1800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [loading]);

  async function run() {
    setLoading(true);
    setError(null);
    setUrl(null);
    setRevised(null);
    setModel(null);
    setLatencyMs(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, fast: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setUrl(data.url);
      setRevised(data.revisedPrompt || null);
      setModel(data.model || null);
      setLatencyMs(typeof data.latencyMs === "number" ? data.latencyMs : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel
        title="Generative Image"
        description="Fast image generation (tries gpt-image-1 first, then DALL·E fallbacks)."
        action={
          <Badge className="border-0 bg-cyan-400/15 text-cyan-100">
            <Zap className="size-3" />
            Fast mode
          </Badge>
        }
      >
        <FieldLabel>Prompt</FieldLabel>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="mb-4 min-h-36 border-white/10 bg-black/30"
        />
        <Button
          onClick={run}
          disabled={loading || !prompt.trim()}
          className="h-11 w-full bg-cyan-300 text-zinc-950 shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:bg-cyan-200"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {loading ? "Generating…" : "Generate image"}
        </Button>
      </Panel>

      <Panel title="Output">
        {loading ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-cyan-400/15 bg-black/25 px-4 py-14">
            <Loader2 className="size-8 animate-spin text-cyan-300" />
            <p className="text-sm font-medium text-cyan-100">{STAGES[stage]}</p>
            <div className="flex gap-1.5">
              {STAGES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    i <= stage ? "bg-cyan-300" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : null}
        {error ? <ErrorBox message={error} /> : null}
        {!loading && !error && !url ? (
          <EmptyState label="Generated image will appear here." />
        ) : null}
        {url ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Generated"
              className="w-full rounded-xl ring-1 ring-cyan-400/20"
            />
            <div className="flex flex-wrap gap-2 text-xs text-zinc-500">
              {model ? <span>Model: {model}</span> : null}
              {latencyMs != null ? <span>· {Math.round(latencyMs / 100) / 10}s</span> : null}
            </div>
            {revised ? (
              <ResultBox className="text-xs text-zinc-400">{revised}</ResultBox>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
