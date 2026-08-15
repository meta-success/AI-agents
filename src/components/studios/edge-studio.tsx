"use client";

import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { runOnDeviceClassifier } from "@/lib/edge-ml";
import { FieldLabel, Panel, ResultBox } from "@/components/dashboard/ui-bits";

export function EdgeStudio() {
  const [text, setText] = useState(
    "This product is amazing and incredibly helpful. Not trash at all."
  );

  const prediction = useMemo(() => runOnDeviceClassifier(text), [text]);

  return (
    <Panel
      title="Edge AI / On-device ML"
      description="Lexicon classifier runs fully in your browser — zero server round-trip."
      className="max-w-3xl"
    >
      <FieldLabel>On-device input</FieldLabel>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mb-4 min-h-32 border-white/10 bg-black/30"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Sentiment" value={prediction.sentiment} />
        <Metric label="Score" value={String(prediction.sentimentScore)} />
        <Metric label="Toxicity" value={prediction.toxicityRisk} />
      </div>
      <ResultBox className="mt-4 font-mono text-xs">
        {JSON.stringify(prediction, null, 2)}
      </ResultBox>
      <p className="mt-3 text-xs text-zinc-500">
        Runtime: {prediction.runtime} · latency {prediction.latencyMs}ms
      </p>
    </Panel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3">
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-cyan-200">{value}</p>
    </div>
  );
}
