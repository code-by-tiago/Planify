"use client";

import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { lessonBundleTools, teachyQuickActions } from "@/lib/pro/teachyStudio";

const LESSON_TOPIC = "Ciclo da água";

/** Mock visual HUD — pacote de aula (sem lógica de geração) */
export function TeachyLessonPreview({ showCta = true }: { showCta?: boolean }) {
  const byTag = new Map<string, typeof lessonBundleTools>();
  for (const item of lessonBundleTools) {
    const list = byTag.get(item.tag) ?? [];
    list.push(item);
    byTag.set(item.tag, list);
  }

  return (
    <div className="relative isolate mx-auto w-full max-w-lg overflow-hidden">
      <div className="pl-hud-glass relative rounded-2xl p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-cyan-400/15 pb-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-600">
              Assistente IA · BNCC
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950 sm:text-xl">
              {LESSON_TOPIC} — Aula 1
            </h2>
          </div>
          <span className="shrink-0 rounded-lg border border-cyan-400/20 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-slate-600">
            Alterar tema
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {[...byTag.entries()].slice(0, 2).map(([tag, items]) => (
            <div key={tag}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {tag}
              </p>
              <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                {items.slice(0, tag === "Sala" ? 2 : 1).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-cyan-400/15 bg-white/70 p-2.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                        <PlanifyIcon name={item.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[9px] font-bold uppercase text-cyan-600">
                        {item.label}
                      </span>
                    </span>
                    <p className="mt-1.5 line-clamp-2 text-[11px] font-bold leading-snug text-slate-800">
                      {LESSON_TOPIC} · {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-cyan-400/15 pt-3">
          {teachyQuickActions.slice(0, 5).map((action) => (
            <span
              key={action.id}
              className="rounded-lg border border-cyan-400/15 bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-slate-600"
            >
              {action.label}
            </span>
          ))}
        </div>

        {showCta ? (
          <Link
            href="/planos"
            className="pl-hud-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold"
          >
            Ver planos
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
