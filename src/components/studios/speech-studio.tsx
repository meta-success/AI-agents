"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ErrorBox,
  FieldLabel,
  Panel,
  ResultBox,
} from "@/components/dashboard/ui-bits";

export function SpeechStudio() {
  const [transcript, setTranscript] = useState("");
  const [ttsText, setTtsText] = useState("Nexus Agent can speak and listen.");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setError(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const base64 = await blobToBase64(blob);
      setLoading(true);
      try {
        const res = await fetch("/api/speech", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "transcribe",
            audioBase64: base64,
            audioMimeType: "audio/webm",
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        setTranscript(data.text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Transcription failed");
      } finally {
        setLoading(false);
        stream.getTracks().forEach((t) => t.stop());
      }
    };
    mediaRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  async function speak() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "speak", text: ttsText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
      await audio.play();
    } catch (e) {
      setError(e instanceof Error ? e.message : "TTS failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="Speech-to-Text" description="Whisper transcription from microphone audio.">
        <div className="mb-4 flex gap-2">
          {!recording ? (
            <Button onClick={startRecording} variant="outline" className="border-white/15">
              <Mic className="size-4" /> Start recording
            </Button>
          ) : (
            <Button onClick={stopRecording} className="bg-red-400/90 text-zinc-950 hover:bg-red-300">
              Stop & transcribe
            </Button>
          )}
          {loading ? <Loader2 className="size-5 animate-spin text-cyan-300" /> : null}
        </div>
        {transcript ? <ResultBox>{transcript}</ResultBox> : null}
      </Panel>
      <Panel title="Text-to-Speech" description="Generative audio via OpenAI TTS.">
        <FieldLabel>Text to speak</FieldLabel>
        <Textarea
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          className="mb-4 min-h-28 border-white/10 bg-black/30"
        />
        <Button onClick={speak} disabled={loading || !ttsText.trim()} className="bg-cyan-400 text-zinc-950 hover:bg-cyan-300">
          <Volume2 className="size-4" /> Generate speech
        </Button>
      </Panel>
      {error ? <div className="lg:col-span-2"><ErrorBox message={error} /></div> : null}
    </div>
  );
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
