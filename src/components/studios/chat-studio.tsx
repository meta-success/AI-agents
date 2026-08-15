"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatStudio() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hi — I'm Nexus Chat. Ask me anything about your project, docs, or AI workflows.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

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
    <section className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-cyan-400/15 bg-zinc-950/70 shadow-[0_0_0_1px_rgba(34,211,238,0.05)_inset,0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      {/* Header */}
      <div className="relative flex items-center gap-3 border-b border-cyan-400/10 px-5 py-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-transparent to-fuchsia-400/5"
        />
        <div className="relative size-12 overflow-hidden rounded-2xl ring-2 ring-cyan-300/40 shadow-[0_0_24px_rgba(34,211,238,0.35)]">
          <Image
            src="/mascot.png"
            alt="Nexus Chat"
            fill
            sizes="48px"
            className="object-cover object-top"
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
              Nexus Chat
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-medium text-cyan-200">
              <span className="size-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]" />
              Online
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Conversational AI · multi-turn memory
          </p>
        </div>
        <Sparkles className="relative size-4 text-cyan-300/70" />
      </div>

      {/* Messages */}
      <div className="max-h-[460px] space-y-4 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.06),_transparent_55%)] px-4 py-5 sm:px-5">
        {messages.map((m, i) => (
          <div
            key={`${m.role}-${i}`}
            className={cn(
              "flex gap-2.5",
              m.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {m.role === "assistant" ? (
              <div className="relative mt-0.5 size-8 shrink-0 overflow-hidden rounded-full ring-1 ring-cyan-300/30">
                <Image
                  src="/mascot.png"
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover object-top"
                />
              </div>
            ) : null}
            <div
              className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                m.role === "user"
                  ? "rounded-br-md bg-gradient-to-br from-cyan-400 to-sky-400 text-zinc-950"
                  : "rounded-bl-md border border-white/10 bg-white/[0.05] text-zinc-100"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading ? (
          <div className="flex items-center gap-2.5">
            <div className="relative size-8 overflow-hidden rounded-full ring-1 ring-cyan-300/30">
              <Image
                src="/mascot.png"
                alt=""
                fill
                sizes="32px"
                className="object-cover object-top"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.05] px-3.5 py-3">
              <span className="size-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:0ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:120ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:240ms]" />
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error ? (
        <div className="mx-4 mb-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-xs leading-relaxed text-red-100 sm:mx-5">
          {error}
        </div>
      ) : null}

      {/* Composer */}
      <div className="border-t border-cyan-400/10 bg-black/30 p-4 sm:p-5">
        <div className="flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-zinc-900/80 p-1.5 shadow-[0_0_24px_rgba(34,211,238,0.08)] focus-within:border-cyan-300/40">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Message Nexus Chat…"
            className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            onClick={send}
            disabled={loading || !input.trim()}
            size="icon"
            className="size-10 shrink-0 rounded-xl bg-cyan-300 text-zinc-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] hover:bg-cyan-200"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
        <p className="mt-3 text-center text-[11px] text-zinc-600">
          Skill proof: Conversational AI / Chatbots + NLP
        </p>
      </div>
    </section>
  );
}
