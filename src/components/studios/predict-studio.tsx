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

const SAMPLE = `month,value
Jan,120
Feb,132
Mar,128
Apr,145
May,151
Jun,160`;

export function PredictStudio() {
  const [csv, setCsv] = useState(SAMPLE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    forecast: unknown;
    narrative: string;
    series: number[];
  } | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, horizon: 3 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult({
        forecast: data.forecast,
        narrative: data.narrative,
        series: data.series,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Predict failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Predictive Analytics" description="Forecast next values from CSV time series.">
        <FieldLabel>CSV (last column = numeric value)</FieldLabel>
        <Textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className="mb-4 min-h-48 border-white/10 bg-black/30 font-mono text-xs"
        />
        <Button onClick={run} disabled={loading || !csv.trim()} className="bg-teal-400 text-zinc-950 hover:bg-teal-300">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Forecast
        </Button>
      </Panel>
      <Panel title="Forecast">
        {loading ? <LoadingBlock label="Running baseline + narrative forecast…" /> : null}
        {error ? <ErrorBox message={error} /> : null}
        {!loading && !error && !result ? <EmptyState label="Forecast output appears here." /> : null}
        {result ? (
          <div className="space-y-3">
            <ResultBox className="font-mono text-xs">{JSON.stringify(result.forecast, null, 2)}</ResultBox>
            <ResultBox>{result.narrative}</ResultBox>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
