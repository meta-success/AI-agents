"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function Panel({
  title,
  description,
  children,
  className,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/60 p-5 shadow-[0_0_0_1px_rgba(34,211,238,0.04)_inset,0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:p-6",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full bg-cyan-400/10 blur-3xl"
      />
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-400">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}

export function ResultBox({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "whitespace-pre-wrap rounded-xl border border-cyan-400/10 bg-black/40 p-4 text-sm leading-relaxed text-zinc-200",
        className
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-cyan-400/20 bg-cyan-400/[0.03] px-4 py-12 text-center text-sm text-zinc-500">
      {label}
    </div>
  );
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-cyan-400/15 bg-black/25 px-4 py-12">
      <Loader2 className="size-7 animate-spin text-cyan-300" />
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-zinc-300">{children}</label>;
}
