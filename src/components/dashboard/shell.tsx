"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Activity,
  Bot,
  Eye,
  FileText,
  LayoutGrid,
  LineChart,
  Menu,
  MessageSquare,
  Mic2,
  ScanText,
  Shield,
  Sparkles,
  Tags,
  ThumbsUp,
  Wand2,
  Cpu,
  X,
  type LucideIcon,
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

const STUDIO_ICONS: Record<StudioId, LucideIcon> = {
  agent: Bot,
  chat: MessageSquare,
  nlp: ScanText,
  vision: Eye,
  speech: Mic2,
  generate: Sparkles,
  document: FileText,
  predict: LineChart,
  annotate: Tags,
  align: ThumbsUp,
  finetune: Wand2,
  safety: Shield,
  edge: Cpu,
  skills: LayoutGrid,
};

const GROUPS: { id: Studio["group"]; label: string }[] = [
  { id: "core", label: "Core AI" },
  { id: "create", label: "Create & Analyze" },
  { id: "train", label: "Train & Align" },
];

type Studio = (typeof STUDIOS)[number];

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

  function NavButton({ s }: { s: Studio }) {
    const Icon = STUDIO_ICONS[s.id];
    const selected = studio === s.id;
    return (
      <button
        key={s.id}
        type="button"
        onClick={() => {
          setStudio(s.id);
          setMobileNav(false);
        }}
        className={cn(
          "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-left transition-all duration-300",
          selected
            ? "bg-gradient-to-r from-cyan-400/20 via-sky-400/10 to-transparent text-white shadow-[0_0_24px_rgba(34,211,238,0.12)]"
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
        )}
      >
        {selected ? (
          <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
        ) : null}
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-300",
            selected
              ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.35)]"
              : "border-white/8 bg-white/[0.03] text-zinc-500 group-hover:border-cyan-400/20 group-hover:text-cyan-200"
          )}
        >
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold tracking-tight">{s.label}</span>
          <span className="block truncate text-[11px] opacity-65">{s.description}</span>
        </span>
        {s.id === "skills" ? (
          <span className="flex size-6 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/15 text-[10px] font-bold text-cyan-200">
            {SKILLS.length}
          </span>
        ) : null}
      </button>
    );
  }

  return (
    <div className="relative flex min-h-full">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(34,211,238,0.16),_transparent_45%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.10),_transparent_40%),radial-gradient(ellipse_at_top_right,_rgba(244,114,182,0.06),_transparent_35%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:52px_52px]"
      />

      {mobileNav ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col border-r border-cyan-400/10 bg-[#05070d]/95 shadow-[8px_0_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl transition-transform lg:static lg:translate-x-0",
          mobileNav ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="relative overflow-hidden border-b border-cyan-400/10 px-4 py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-cyan-400/20 blur-3xl"
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-cyan-400/40 blur-md" />
                <div className="relative size-12 overflow-hidden rounded-2xl ring-2 ring-cyan-300/50 shadow-[0_0_24px_rgba(34,211,238,0.45)]">
                  <Image
                    src="/mascot.png"
                    alt="Nexus Agent mascot"
                    fill
                    sizes="48px"
                    className="object-cover object-top"
                    priority
                  />
                </div>
              </div>
              <div>
                <p className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-white">
                  Nexus Agent
                </p>
                <p className="bg-gradient-to-r from-cyan-300 to-sky-200 bg-clip-text text-[11px] font-medium text-transparent">
                  AI skill workbench
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-zinc-400 lg:hidden"
              onClick={() => setMobileNav(false)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1 px-3 py-4">
          <nav className="space-y-5">
            {GROUPS.map((group) => (
              <div key={group.id}>
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {STUDIOS.filter((s) => s.group === group.id).map((s) => (
                    <NavButton key={s.id} s={s} />
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </ScrollArea>

        <div className="space-y-3 border-t border-cyan-400/10 p-3">
          <button
            type="button"
            onClick={() => {
              setStudio("skills");
              setMobileNav(false);
            }}
            className={cn(
              "relative w-full overflow-hidden rounded-2xl border p-3 text-left transition-all duration-300",
              studio === "skills"
                ? "border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.2)]"
                : "border-white/10 bg-gradient-to-br from-white/[0.05] to-cyan-400/[0.04] hover:border-cyan-300/30"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/30">
                  <LayoutGrid className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Skills map</p>
                  <p className="text-[11px] text-zinc-500">20 / 20 Rework proofs</p>
                </div>
              </div>
              <Badge className="border-0 bg-cyan-300 text-[10px] font-bold text-zinc-950 hover:bg-cyan-300">
                {SKILLS.length}
              </Badge>
            </div>
          </button>

          <div className="flex items-center gap-2 rounded-xl px-2 py-1 text-xs text-zinc-500">
            <Activity
              className={cn(
                "size-3.5",
                health === "ok" && "text-cyan-400",
                health === "down" && "text-red-400",
                health === "checking" && "text-zinc-600"
              )}
            />
            <span>
              MLOps{" "}
              {health === "ok" ? "online" : health === "down" ? "degraded" : "checking…"}
            </span>
          </div>
        </div>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#05070d]/75 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon-sm"
                className="border-cyan-400/20 bg-cyan-400/5 lg:hidden"
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
              <Badge variant="outline" className="border-cyan-400/35 text-cyan-200">
                gpt-4o
              </Badge>
              <Badge variant="outline" className="border-sky-400/35 text-sky-200">
                GraphQL RAG
              </Badge>
              <Badge variant="outline" className="border-zinc-500/40 text-zinc-300">
                20 skills
              </Badge>
            </div>
          </div>
          {active.skills.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto border-t border-white/[0.04] px-4 py-2.5 sm:px-6">
              {active.skills.map((id) => {
                const skill = SKILLS.find((s) => s.id === id);
                return (
                  <span
                    key={id}
                    className="shrink-0 rounded-full border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1 text-[11px] text-cyan-100/80"
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
