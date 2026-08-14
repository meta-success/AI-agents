"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  EmptyState,
  ErrorBox,
  FieldLabel,
  LoadingBlock,
  Panel,
  ResultBox,
} from "@/components/dashboard/ui-bits";

export function VisionStudio() {
  const [preview, setPreview] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [mime, setMime] = useState<string | null>(null);
  const [question, setQuestion] = useState("Detect objects, read any text (OCR), and describe the scene.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(file: File | null) {
    if (!file) {
      setPreview(null);
      setBase64(null);
      setMime(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const [, payload = ""] = dataUrl.split(",");
      setPreview(dataUrl);
      setBase64(payload);
      setMime(file.type);
    };
    reader.readAsDataURL(file);
  }

  async function run() {
    if (!base64 || !mime) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, imageMimeType: mime, question }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Vision failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Computer Vision Lab" description="Scene analysis, object detection narrative, and OCR.">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        <div className="mb-4 flex gap-2">
          <Button type="button" variant="outline" className="border-white/15" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="size-4" /> Upload image
          </Button>
          {preview ? (
            <Button type="button" variant="ghost" onClick={() => onFile(null)}>
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Vision input" className="mb-4 max-h-56 rounded-xl object-contain ring-1 ring-white/10" />
        ) : null}
        <FieldLabel>Vision question</FieldLabel>
        <Input value={question} onChange={(e) => setQuestion(e.target.value)} className="mb-4 h-10 border-white/10 bg-black/30" />
        <Button onClick={run} disabled={loading || !base64} className="bg-teal-400 text-zinc-950 hover:bg-teal-300">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Analyze image
        </Button>
      </Panel>
      <Panel title="Vision Output">
        {loading ? <LoadingBlock label="Running multimodal vision model…" /> : null}
        {error ? <ErrorBox message={error} /> : null}
        {!loading && !error && !analysis ? <EmptyState label="Upload an image to begin." /> : null}
        {analysis ? <ResultBox>{analysis}</ResultBox> : null}
      </Panel>
    </div>
  );
}
