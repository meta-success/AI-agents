"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listFeedback, listPreferences, savePreference, type FeedbackRecord, type PreferencePair } from "@/lib/local-data";
import { FieldLabel, Panel, ResultBox } from "@/components/dashboard/ui-bits";

export function AlignStudio() {
  const [prompt, setPrompt] = useState("Explain RAG in one paragraph.");
  const [chosen, setChosen] = useState("RAG retrieves trusted context before generation, reducing hallucinations.");
  const [rejected, setRejected] = useState("RAG is just using Google before ChatGPT.");
  const [prefs, setPrefs] = useState<PreferencePair[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);

  function refresh() {
    setPrefs(listPreferences());
    setFeedback(listFeedback());
  }

  useEffect(() => {
    refresh();
  }, []);

  function addPair() {
    savePreference({ prompt, chosen, rejected });
    refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="RLHF & Alignment" description="Collect preference pairs and review thumbs feedback.">
        <FieldLabel>Prompt</FieldLabel>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mb-3 min-h-20 border-white/10 bg-black/30" />
        <FieldLabel>Chosen (better) answer</FieldLabel>
        <Textarea value={chosen} onChange={(e) => setChosen(e.target.value)} className="mb-3 min-h-20 border-white/10 bg-black/30" />
        <FieldLabel>Rejected answer</FieldLabel>
        <Textarea value={rejected} onChange={(e) => setRejected(e.target.value)} className="mb-4 min-h-20 border-white/10 bg-black/30" />
        <Button onClick={addPair} className="bg-teal-400 text-zinc-950 hover:bg-teal-300">
          Save preference pair
        </Button>
      </Panel>
      <div className="space-y-6">
        <Panel title={`Preference pairs (${prefs.length})`}>
          <div className="max-h-52 space-y-2 overflow-y-auto text-sm">
            {prefs.length === 0 ? <ResultBox className="text-zinc-500">None yet.</ResultBox> : null}
            {prefs.map((p) => (
              <div key={p.id} className="rounded-xl border border-white/10 bg-black/25 p-3">
                <p className="text-zinc-400">{p.prompt}</p>
                <p className="mt-1 text-teal-200">✓ {p.chosen}</p>
                <p className="text-red-300/80">✗ {p.rejected}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title={`Agent thumbs feedback (${feedback.length})`}>
          <div className="max-h-40 space-y-2 overflow-y-auto text-xs text-zinc-400">
            {feedback.length === 0 ? <p>Rate Agent outputs to populate this list.</p> : null}
            {feedback.map((f) => (
              <p key={f.id}>
                [{f.rating}] {f.response.slice(0, 120)}…
              </p>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
