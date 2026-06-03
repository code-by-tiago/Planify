"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { lessonBundleTools } from "@/lib/pro/teachyStudio";

const ROWS = [
  { label: "Para a sala de aula", tag: "Sala" as const },
  { label: "Dever de casa", tag: "Tarefa" as const },
];

type TeachyLessonPreviewProps = {
  variant?: "default" | "hero";
};

export function TeachyLessonPreview({ variant = "default" }: TeachyLessonPreviewProps) {
  const salaItems = lessonBundleTools.filter((t) => t.tag === "Sala").slice(0, 3);
  const tarefaItems = lessonBundleTools.filter((t) => t.tag === "Tarefa").slice(0, 3);
  const byTag = { Sala: salaItems, Tarefa: tarefaItems };

  const isHero = variant === "hero";

  return (
    <div
      className={`relative w-full ${isHero ? "pl-teachy-lesson-hero" : "pl-teachy-lesson-card mx-auto max-w-md"}`}
    >
      <div
        className={`overflow-hidden border border-slate-200/90 bg-white shadow-xl ${
          isHero ? "rounded-[1.75rem] shadow-blue-900/10" : "rounded-3xl shadow-slate-200/50"
        }`}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-black text-slate-950 sm:text-lg">
            Ciclo da água — Aula 1
          </h2>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {ROWS.map((row) => (
            <div key={row.label}>
              <p className="mb-2.5 text-xs font-bold text-slate-500">{row.label}</p>
              <div className="grid grid-cols-3 gap-2.5">
                {byTag[row.tag].map((item) => (
                  <div
                    key={item.id}
                    className="aspect-[4/3] rounded-xl bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100"
                    title={item.label}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isHero ? (
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <PlanifyIcon name="spark" className="h-3.5 w-3.5 text-blue-500" />
            IA · BNCC
          </span>
        </div>
      ) : null}
    </div>
  );
}

export default TeachyLessonPreview;
