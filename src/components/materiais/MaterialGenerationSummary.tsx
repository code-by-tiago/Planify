"use client";

import type { MaterialGenerationSummary } from "@/lib/materiais/material-generation-summary";

type MaterialGenerationSummaryProps = {
  summary: MaterialGenerationSummary;
};

const toneClass: Record<
  MaterialGenerationSummary["chips"][number]["tone"],
  string
> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-sky-200 bg-sky-50 text-sky-900",
  neutral: "border-slate-200 bg-white text-slate-700",
};

export function MaterialGenerationSummaryPanel({
  summary,
}: MaterialGenerationSummaryProps) {
  if (!summary.chips.length && !summary.warnings.length) return null;

  return (
    <aside className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
        Resumo da entrega
      </p>
      {summary.chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {summary.chips.map((chip) => (
            <span
              key={chip.label}
              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${toneClass[chip.tone]}`}
            >
              {chip.label}
            </span>
          ))}
        </div>
      ) : null}
      {summary.warnings.map((warning) => (
        <p
          key={warning}
          className="mt-2 text-xs font-semibold leading-5 text-amber-800"
        >
          {warning}
        </p>
      ))}
    </aside>
  );
}
