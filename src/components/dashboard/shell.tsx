"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SKILLS, STUDIOS, type StudioId } from "@/lib/skills";
import { AgentStudio } from "@/components/studios/agent-studio";
import { ChatStudio } from "@/components/studios/chat-studio";
import { NlpStudio } from "@/components/studios/nlp-studio";
import { VisionStudio } from "@/components/studios/vision-studio";
import { SpeechStudio } from "@/components/studios/speech-studio";
import { GenerateStudio } from "@/components/studios/generate-studio";
import { DocumentStudio } from "@/components/studios/document-studio";
import { PredictStudio } from "@/components/studios/predict-studio";
import { AnnotateStudio } from "@/components/studios/annotate-studio";
import { AlignStudio } from "@/components/studios/align-studio";
import { FinetuneStudio } from "@/components/studios/finetune-studio";
import { SafetyStudio } from "@/components/studios/safety-studio";
import { EdgeStudio } from "@/components/studios/edge-studio";
import { SkillsStudio } from "@/components/studios/skills-studio";

export function DashboardApp() {
  const [studio, setStudio] = useState<StudioId>("agent");
  const [mobileNav, setMobileNav] = useState(false);
  const [health, setHealth] = useState<"checking" | "ok" | "down">("checking");

  useEffect(() => {
    fetch("/api/agent")
      .then((r) => setHealth(r.ok ? "ok" : "down"))
      .catch(() => setHealth("down"));
  }, []);

  const active = STUDIOS.find((s) => s.id === studio)!;

  return (
    <div className="relative flex min-h-full">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(45,212,191,0.14),_transparent_50%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.08),_transparent_40%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.28] [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [background-size:56px_56px]"
      />

      {/* Mobile overlay */}
      {mobileNav ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col border-r border-white/[0.07] bg-zinc-950/95 backdrop-blur-xl transition-transform lg:static lg:translate-x-0",
          mobileNav ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-teal-400/15 ring-1 ring-teal-300/35">
              <Bot className="size-5 text-teal-300" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-white">
                Nexus Agent
              </p>
              <p className="text-[11px] text-zinc-500">AI skill workbench</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileNav(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-2 py-3">
          <nav className="space-y-1">
            {STUDIOS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStudio(s.id);
                  setMobileNav(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors",
                  studio === s.id
                    ? "bg-teal-400/12 text-teal-100 ring-1 ring-teal-300/25"
                    : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200"
                )}
              >
                <span>
                  <span className="block text-sm font-medium">{s.label}</span>
                  <span className="block text-[11px] opacity-70">{s.description}</span>
                </span>
                {s.id === "skills" ? (
                  <Badge
                    variant="outline"
                    className="border-teal-400/30 text-[10px] text-teal-200"
                  >
                    {SKILLS.length}
                  </Badge>
                ) : null}
              </button>
            ))}
          </nav>
        </ScrollArea>

        <div className="border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Activity
              className={cn(
                "size-3.5",
                health === "ok" && "text-teal-400",
                health === "down" && "text-red-400",
                health === "checking" && "text-zinc-500"
              )}
            />
            <span>
              MLOps health:{" "}
              {health === "ok" ? "online" : health === "down" ? "degraded" : "checking…"}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
            {SKILLS.length}/20 Rework skills covered in one deployable app.
          </p>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-zinc-950/70 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon-sm"
                className="border-white/10 bg-white/[0.03] lg:hidden"
                onClick={() => setMobileNav(true)}
              >
                <Menu className="size-4" />
              </Button>
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white sm:text-xl">
                  {active.label}
                </h1>
                <p className="text-xs text-zinc-500 sm:text-sm">{active.description}</p>
              </div>
            </div>
            <div className="hidden flex-wrap items-center justify-end gap-1.5 md:flex">
              <Badge variant="outline" className="border-teal-400/30 text-teal-200">
                gpt-4o
              </Badge>
              <Badge variant="outline" className="border-sky-400/30 text-sky-200">
                GraphQL RAG
              </Badge>
              <Badge variant="outline" className="border-zinc-500/40 text-zinc-300">
                20 skills
              </Badge>
            </div>
          </div>
          {active.skills.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto border-t border-white/[0.05] px-4 py-2 sm:px-6">
              {active.skills.map((id) => {
                const skill = SKILLS.find((s) => s.id === id);
                return (
                  <span
                    key={id}
                    className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-400"
                  >
                    {skill?.name}
                  </span>
                );
              })}
            </div>
          ) : null}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-6xl animate-in fade-in duration-300">
            {studio === "agent" && <AgentStudio />}
            {studio === "chat" && <ChatStudio />}
            {studio === "nlp" && <NlpStudio />}
            {studio === "vision" && <VisionStudio />}
            {studio === "speech" && <SpeechStudio />}
            {studio === "generate" && <GenerateStudio />}
            {studio === "document" && <DocumentStudio />}
            {studio === "predict" && <PredictStudio />}
            {studio === "annotate" && <AnnotateStudio />}
            {studio === "align" && <AlignStudio />}
            {studio === "finetune" && <FinetuneStudio />}
            {studio === "safety" && <SafetyStudio />}
            {studio === "edge" && <EdgeStudio />}
            {studio === "skills" && <SkillsStudio onOpen={setStudio} />}
          </div>
        </main>
      </div>
    </div>
  );
}
