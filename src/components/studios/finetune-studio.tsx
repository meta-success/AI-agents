"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildFineTuneJsonl, listAnnotations, listPreferences } from "@/lib/local-data";
import { Panel, ResultBox } from "@/components/dashboard/ui-bits";

export function FinetuneStudio() {
  const [preview, setPreview] = useState("");
  const [counts, setCounts] = useState({ annotations: 0, preferences: 0 });

  function refresh() {
    setCounts({
      annotations: listAnnotations().length,
      preferences: listPreferences().length,
    });
    setPreview(buildFineTuneJsonl());
  }

  useEffect(() => {
    refresh();
  }, []);

  function download() {
    const blob = new Blob([preview || buildFineTuneJsonl()], {
      type: "application/jsonl",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexus-finetune.jsonl";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Panel
      title="Model Fine-tuning Export"
      description="Convert annotations + RLHF preferences into OpenAI-style JSONL."
      className="max-w-4xl"
      action={
        <Button onClick={download} disabled={!preview} className="bg-cyan-400 text-zinc-950 hover:bg-cyan-300">
          <Download className="size-4" /> Download JSONL
        </Button>
      }
    >
      <p className="mb-4 text-sm text-zinc-400">
        Dataset size: {counts.annotations} annotations · {counts.preferences} preference pairs.
        Add more in Annotate / Align, then refresh.
      </p>
      <Button variant="outline" className="mb-4 border-white/15" onClick={refresh}>
        Refresh dataset
      </Button>
      <ResultBox className="max-h-[420px] overflow-auto font-mono text-[11px] text-zinc-400">
        {preview || "No training rows yet. Label data or save preference pairs first."}
      </ResultBox>
    </Panel>
  );
}
