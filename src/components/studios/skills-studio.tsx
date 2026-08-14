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
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-sky-400 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SKILLS.map((skill) => {
            const studio = STUDIOS.find((s) => s.skills.includes(skill.id));
            return (
              <div
                key={skill.id}
                className="rounded-xl border border-white/[0.08] bg-black/25 p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-white">{skill.name}</p>
                  <Badge variant="outline" className="border-teal-400/30 text-teal-200">
                    Proven
                  </Badge>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-zinc-500">{skill.proof}</p>
                {studio ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/15"
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
