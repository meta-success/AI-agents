"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  EmptyState,
  ErrorBox,
  FieldLabel,
  LoadingBlock,
  Panel,
  ResultBox,
} from "@/components/dashboard/ui-bits";

export function GenerateStudio() {
  const [prompt, setPrompt] = useState(
    "A cute fluffy cat with big sparkling eyes, soft neon cyan lighting, anime style"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [revised, setRevised] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setUrl(null);
    setRevised(null);
    setModel(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setUrl(data.url);
      setRevised(data.revisedPrompt || null);
      setModel(data.model || null);
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
        description="Creates images via gpt-image-1, with DALL·E fallbacks if needed."
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
          className="bg-cyan-300 text-zinc-950 shadow-[0_0_24px_rgba(34,211,238,0.3)] hover:bg-cyan-200"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          Generate image
        </Button>
      </Panel>
      <Panel title="Output">
        {loading ? <LoadingBlock label="Generating image…" /> : null}
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
            {model ? (
              <p className="text-xs text-zinc-500">Model: {model}</p>
            ) : null}
            {revised ? (
              <ResultBox className="text-xs text-zinc-400">{revised}</ResultBox>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
