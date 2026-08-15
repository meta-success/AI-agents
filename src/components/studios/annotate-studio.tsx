"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteAnnotation,
  listAnnotations,
  saveAnnotation,
  type AnnotationRecord,
} from "@/lib/local-data";
import { FieldLabel, Panel, ResultBox } from "@/components/dashboard/ui-bits";

export function AnnotateStudio() {
  const [text, setText] = useState("");
  const [label, setLabel] = useState("positive");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<AnnotationRecord[]>([]);

  function refresh() {
    setRows(listAnnotations());
  }

  useEffect(() => {
    refresh();
  }, []);

  function add() {
    if (!text.trim() || !label.trim()) return;
    saveAnnotation({ text: text.trim(), label: label.trim(), notes: notes.trim() || undefined });
    setText("");
    setNotes("");
    refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Data Annotation" description="Label text samples for supervised datasets.">
        <FieldLabel>Sample text</FieldLabel>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-3 min-h-28 border-white/10 bg-black/30"
        />
        <FieldLabel>Label</FieldLabel>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mb-3 h-10 border-white/10 bg-black/30"
          placeholder="positive | negative | spam | invoice…"
        />
        <FieldLabel>Notes</FieldLabel>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mb-4 h-10 border-white/10 bg-black/30"
        />
        <Button onClick={add} className="bg-cyan-400 text-zinc-950 hover:bg-cyan-300">
          Save annotation
        </Button>
      </Panel>
      <Panel title={`Labeled set (${rows.length})`}>
        <div className="max-h-[420px] space-y-2 overflow-y-auto">
          {rows.length === 0 ? (
            <ResultBox className="text-zinc-500">No labels yet.</ResultBox>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-black/25 p-3 text-sm">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="rounded-full bg-cyan-400/15 px-2 py-0.5 text-xs text-cyan-200">
                    {r.label}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-500"
                    onClick={() => {
                      deleteAnnotation(r.id);
                      refresh();
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-zinc-300">{r.text}</p>
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
