"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorBox, Panel, ResultBox } from "@/components/dashboard/ui-bits";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatStudio() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Hi — I'm Nexus Chat. Ask me anything about your project, docs, or AI workflows.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Chat failed");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel
      title="Conversational AI"
      description="Multi-turn chatbot with memory of the current session."
      className="max-w-3xl"
    >
      <div className="mb-4 max-h-[420px] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-black/25 p-4">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={
              m.role === "user"
                ? "ml-8 rounded-xl bg-teal-400/15 px-3 py-2 text-sm text-teal-50"
                : "mr-8 rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-200"
            }
          >
            {m.content}
          </div>
        ))}
      </div>
      {error ? <div className="mb-3"><ErrorBox message={error} /></div> : null}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="h-10 border-white/10 bg-black/30"
        />
        <Button onClick={send} disabled={loading} className="bg-teal-400 text-zinc-950 hover:bg-teal-300">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        </Button>
      </div>
      <ResultBox className="mt-4 text-xs text-zinc-500">
        Skill proof: Conversational AI / Chatbots + Natural Language Processing
      </ResultBox>
    </Panel>
  );
}
