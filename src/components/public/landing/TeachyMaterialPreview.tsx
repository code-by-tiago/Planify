"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

/** Mock visual da seção “materiais BNCC” (estilo Teachy professores) */
export function TeachyMaterialPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="pointer-events-none absolute -right-6 -top-4 h-24 w-24 rounded-full bg-amber-200/60 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-4 bottom-8 h-20 w-20 rounded-full bg-emerald-200/50 blur-2xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white p-4 shadow-lg">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white shadow-md">
          <p className="text-[10px] font-black uppercase tracking-wider text-blue-100">
            Apresentação em slides
          </p>
          <p className="mt-2 text-base font-black leading-tight">
            Energia Potencial Elástica
          </p>
          <div className="mt-4 flex h-16 items-center justify-center rounded-xl bg-white/15">
            <PlanifyIcon name="presentation" className="h-8 w-8 text-white/90" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          {["Plano", "Lista", "Quiz"].map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700"
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
