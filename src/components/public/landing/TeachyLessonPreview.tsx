"use client";

import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { lessonBundleTools, teachyQuickActions } from "@/lib/pro/teachyStudio";

const LESSON_TOPIC = "Ciclo da água";

/** Mock visual do hero Teachy — pacote de aula sem lógica de geração */
export function TeachyLessonPreview() {
  const byTag = new Map<string, typeof lessonBundleTools>();
  for (const item of lessonBundleTools) {
    const list = byTag.get(item.tag) ?? [];
    list.push(item);
    byTag.set(item.tag, list);
  }

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        className="pl-teachy-hero-blob pointer-events-none absolute -right-6 top-6 -z-10 h-[min(100%,420px)] w-[min(100%,480px)]"
        aria-hidden
      />

      <div className="relative rounded-3xl border border-white/60 bg-white p-4 shadow-2xl shadow-blue-200/40 max-lg:backdrop-blur-none sm:bg-white/95 sm:backdrop-blur-sm sm:p-5">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
              Assistente IA · BNCC
            </p>
            <h2 className="mt-1 text-lg font-black text-slate-950 sm:text-xl">
              {LESSON_TOPIC} — Aula 1
            </h2>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600">
            Alterar tema
          </span>
        </div>

        <div className="mt-4 space-y-4">
          {[...byTag.entries()].slice(0, 2).map(([tag, items]) => (
            <div key={tag}>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                {tag}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.slice(0, tag === "Sala" ? 3 : 2).map((item) => (
                  <div
                    key={item.id}
                    className="min-w-[120px] flex-1 rounded-xl border border-slate-100 bg-slate-50/90 p-2.5"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <PlanifyIcon name={item.icon} className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[9px] font-black uppercase text-blue-600">
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

        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {teachyQuickActions.slice(0, 5).map((action) => (
            <span
              key={action.id}
              className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600"
            >
              {action.label}
            </span>
          ))}
        </div>

        <Link
          href="/planos"
          className="pl-teachy-cta mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-black text-slate-900"
        >
          Ver planos
          <PlanifyIcon name="arrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
