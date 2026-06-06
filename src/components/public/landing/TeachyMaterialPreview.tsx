"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

/** Mock visual da seção “materiais BNCC” (estilo Teachy professores) */
export function TeachyMaterialPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="pointer-events-none absolute -right-6 -top-4 hidden h-24 w-24 rounded-full bg-amber-200/60 blur-2xl sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-4 bottom-8 hidden h-20 w-20 rounded-full bg-emerald-200/50 blur-2xl sm:block"
        aria-hidden
      />

      <div className="pl-hud-glass relative overflow-hidden rounded-3xl p-4">
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-800 p-4 text-white shadow-[0_0_24px_rgba(0,212,255,0.25)]">
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-100">
            Apresentação em slides
          </p>
          <p className="mt-2 text-base font-black leading-tight">
            Energia Potencial Elástica
          </p>
          <div className="mt-4 flex h-16 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <PlanifyIcon name="presentation" className="h-8 w-8 text-white/90" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {["Plano", "Lista", "Quiz"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-cyan-400/20 bg-cyan-50/80 px-2.5 py-1 text-[10px] font-black text-cyan-700"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TeachyMaterialPreview;
