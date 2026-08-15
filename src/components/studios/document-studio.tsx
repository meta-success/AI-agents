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

export function DocumentStudio() {
  const [text, setText] = useState("");
  const [filename, setFilename] = useState("notes.txt");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<Record<string, unknown> | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);

  async function onFile(file: File | null) {
    if (!file) return;
    setFilename(file.name);
    setText(await file.text());
  }

  async function run() {
    setLoading(true);
    setError(null);
    setExtracted(null);
    try {
      const res = await fetch("/api/document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, filename }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setExtracted(data.extracted);
      setChunks(data.ragChunks || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Document AI failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Document AI" description="Extract structured fields and chunk text for RAG.">
        <input
          type="file"
          accept=".txt,.md,.csv,.json"
          className="mb-3 block w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-zinc-200"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <FieldLabel>Document text</FieldLabel>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-4 min-h-44 border-white/10 bg-black/30"
          placeholder="Paste contract notes, meeting minutes, or invoices…"
        />
        <Button onClick={run} disabled={loading || !text.trim()} className="bg-cyan-400 text-zinc-950 hover:bg-cyan-300">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Extract
        </Button>
      </Panel>
      <Panel title="Extraction + RAG chunks">
        {loading ? <LoadingBlock label="Extracting entities and actions…" /> : null}
        {error ? <ErrorBox message={error} /> : null}
        {!loading && !error && !extracted ? <EmptyState label="Structured extraction appears here." /> : null}
        {extracted ? (
          <div className="space-y-3">
            <ResultBox className="font-mono text-xs">{JSON.stringify(extracted, null, 2)}</ResultBox>
            {chunks.length ? (
              <details className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-zinc-400">
                <summary className="cursor-pointer text-zinc-300">RAG chunks ({chunks.length})</summary>
                <div className="mt-2 space-y-2">
                  {chunks.map((c, i) => (
                    <p key={i} className="rounded-lg bg-black/30 p-2">
                      {c.slice(0, 220)}…
                    </p>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
