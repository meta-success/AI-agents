"use client";

import { SKILLS, STUDIOS, type StudioId } from "@/lib/skills";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/dashboard/ui-bits";

export function SkillsStudio({ onOpen }: { onOpen: (id: StudioId) => void }) {
  const covered = SKILLS.length;
  const target = 20;
  const pct = Math.round((covered / target) * 100);

  return (
    <div className="space-y-6">
      <Panel
        title="Rework skill coverage"
        description={`${covered}/${target} skills implemented (${pct}%) — target ≥ 80%.`}
      >
        <div className="mb-2 flex items-end justify-between gap-3">
          <p className="font-[family-name:var(--font-display)] text-3xl font-semibold text-cyan-200">
            {pct}%
          </p>
          <p className="text-xs text-zinc-500">All 20 proofs wired into studios</p>
        </div>
        <div className="mb-6 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.55)] transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SKILLS.map((skill) => {
            const studio = STUDIOS.find((s) => s.skills.includes(skill.id));
            return (
              <div
                key={skill.id}
                className="group rounded-2xl border border-white/[0.08] bg-black/30 p-4 transition-all hover:border-cyan-300/30 hover:bg-cyan-400/[0.05] hover:shadow-[0_0_24px_rgba(34,211,238,0.12)]"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{skill.name}</p>
                  <Badge
                    variant="outline"
                    className="border-cyan-400/30 text-cyan-200 group-hover:border-cyan-300/50"
                  >
                    Proven
                  </Badge>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-zinc-500">{skill.proof}</p>
                {studio ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-cyan-400/20 hover:bg-cyan-400/10"
                    onClick={() => onOpen(studio.id)}
                  >
                    Open {studio.label}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
