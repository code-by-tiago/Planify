"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyTool } from "@/lib/pro/planifyTools";

const CATEGORY_LABELS: Record<string, string> = {
  planejamento: "Planejamento",
  "preparar-aulas": "Preparar aulas",
  avaliacoes: "Avaliações",
  engajar: "Engajar alunos",
  correcao: "Correção",
};

const STUDIO_STEPS = ["Tema", "Configurar", "Gerar", "Revisar"] as const;

type MaterialStudioStepHeaderProps = {
  tool: PlanifyTool;
  hasResult?: boolean;
  isGenerating?: boolean;
};

export function MaterialStudioStepHeader({
  tool,
  hasResult = false,
  isGenerating = false,
}: MaterialStudioStepHeaderProps) {
  const categoryLabel = CATEGORY_LABELS[tool.category] ?? "Material";
  const activeStep = isGenerating ? 2 : hasResult ? 3 : 1;

  return (
    <header className="pf-material-studio-header mb-4 rounded-xl border border-[var(--pl-border-teal)] bg-gradient-to-r from-white to-[var(--pl-surface-teal)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="pf-eyebrow">{categoryLabel}</p>
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
            >
              <PlanifyIcon name={tool.icon} className="h-4 w-4" />
            </span>
            <h2 className="truncate text-base font-black text-slate-950 sm:text-lg">
              {tool.shortTitle}
            </h2>
          </div>
        </div>
        <span className="rounded-full border border-[var(--pl-border-teal)] bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--pl-teal-deep)]">
          Estúdio · Crie
        </span>
      </div>

      <ol className="mt-4 flex gap-2 overflow-x-auto pb-0.5" aria-label="Etapas do material">
        {STUDIO_STEPS.map((label, index) => {
          const stepNum = index + 1;
          const done = stepNum < activeStep;
          const current = stepNum === activeStep;
          return (
            <li
              key={label}
              className={[
                "flex min-w-[4.5rem] flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-bold sm:text-xs",
                current
                  ? "bg-[var(--pl-surface-teal)] text-[var(--pl-teal-deep)]"
                  : done
                    ? "text-emerald-700"
                    : "text-slate-400",
              ].join(" ")}
              aria-current={current ? "step" : undefined}
            >
              <span
                className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-black",
                  current
                    ? "bg-[var(--pl-teal)] text-white"
                    : done
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {done ? "✓" : stepNum}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </header>
  );
}
