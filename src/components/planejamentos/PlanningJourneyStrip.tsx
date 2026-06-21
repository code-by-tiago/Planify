"use client";

import type { PlanningWizardStep } from "./PlanningWizardStepper";

const JOURNEY_STEPS = [
  { id: 1, label: "Conteúdos" },
  { id: 2, label: "BNCC" },
  { id: 3, label: "Aprovação" },
  { id: 4, label: "Geração" },
  { id: 5, label: "Revisão" },
  { id: 6, label: "Exportação" },
] as const;

function resolveActiveJourneyStep(wizardStep: PlanningWizardStep): number {
  if (wizardStep === 1) return 1;
  if (wizardStep === 2) return 4;
  return 6;
}

type PlanningJourneyStripProps = {
  wizardStep: PlanningWizardStep;
};

/** Indicador visual de 6 etapas — mapeia para o fluxo existente de 3 passos. */
export function PlanningJourneyStrip({ wizardStep }: PlanningJourneyStripProps) {
  const active = resolveActiveJourneyStep(wizardStep);

  return (
    <nav
      aria-label="Jornada do planejamento"
      className="pf-journey-strip mb-4 rounded-xl border border-[var(--pl-border-teal)] bg-white/90 px-3 py-3 sm:px-4"
    >
      <ol className="flex gap-1 overflow-x-auto pb-0.5 sm:gap-2">
        {JOURNEY_STEPS.map((step) => {
          const done = step.id < active;
          const current = step.id === active;
          return (
            <li key={step.id} className="min-w-[4.5rem] shrink-0 flex-1 sm:min-w-0">
              <div
                className={[
                  "pf-journey-step flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-center transition",
                  current ? "pf-journey-step--active" : "",
                  done ? "pf-journey-step--done" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={current ? "step" : undefined}
              >
                <span
                  className={[
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black",
                    current
                      ? "bg-[var(--pl-teal)] text-white"
                      : done
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {done ? "✓" : step.id}
                </span>
                <span className="text-[10px] font-bold leading-tight text-slate-600 sm:text-[11px]">
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
