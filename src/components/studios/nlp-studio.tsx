"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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

export function NlpStudio() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nlp, setNlp] = useState<Record<string, unknown> | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setNlp(null);
    try {
      const res = await fetch("/api/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setNlp(data.nlp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "NLP failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="NLP Desk" description="Sentiment, entities, keywords, and summary.">
        <FieldLabel>Text</FieldLabel>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-4 min-h-40 border-white/10 bg-black/30"
          placeholder="Paste a paragraph for linguistic analysis…"
        />
        <Button onClick={run} disabled={loading || !text.trim()} className="bg-cyan-400 text-zinc-950 hover:bg-cyan-300">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Run NLP
        </Button>
      </Panel>
      <Panel title="Structured Output">
        {loading ? <LoadingBlock label="Extracting linguistic features…" /> : null}
        {error ? <ErrorBox message={error} /> : null}
        {!loading && !error && !nlp ? <EmptyState label="NLP results appear here." /> : null}
        {nlp ? <ResultBox className="font-mono text-xs">{JSON.stringify(nlp, null, 2)}</ResultBox> : null}
      </Panel>
    </div>
  );
}
