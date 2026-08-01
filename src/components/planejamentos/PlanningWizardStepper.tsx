"use client";

type PlanningWizardStep = 1 | 2 | 3;

type PlanningWizardStepperProps = {
  step: PlanningWizardStep;
  onStepChange: (step: PlanningWizardStep) => void;
  stats: {
    conteudos: number;
    conteudosComBncc?: number;
    selecionadas: number;
    matriz: number;
  };
  canGoToStep2: boolean;
  canGoToStep3: boolean;
};

const STEPS: { id: PlanningWizardStep; label: string; hint: string }[] = [
  { id: 1, label: "Conteúdos", hint: "Dados e temas" },
  { id: 2, label: "BNCC e IA", hint: "Habilidades e matriz" },
  { id: 3, label: "Exportar", hint: "Google Docs oficial" },
];

export function PlanningWizardStepper({
  step,
  onStepChange,
  stats,
  canGoToStep2,
  canGoToStep3,
}: PlanningWizardStepperProps) {
  function canActivate(target: PlanningWizardStep): boolean {
    if (target === 1) return true;
    if (target === 2) return canGoToStep2;
    if (target === 3) return canGoToStep3;
    return false;
  }

  return (
    <nav
      aria-label="Etapas do planejamento"
      className="rounded-2xl border border-cyan-400/20 bg-white/80 p-4 sm:p-5"
    >
      <ol className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0">
        {STEPS.map((item) => {
          const active = step === item.id;
          const done = step > item.id;
          const disabled = !canActivate(item.id);
          return (
            <li key={item.id} className="min-w-[11.5rem] shrink-0 sm:min-w-0">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onStepChange(item.id)}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-cyan-500 bg-cyan-50 shadow-sm"
                    : done
                      ? "border-emerald-200 bg-emerald-50/60 hover:border-emerald-300"
                      : disabled
                        ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
                        : "border-slate-200 bg-white hover:border-cyan-300"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                    active
                      ? "bg-cyan-600 text-white"
                      : done
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {done ? "✓" : item.id}
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-slate-950">
                    {item.label}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500">
                    {item.hint}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-slate-600">
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
          {stats.conteudos} conteúdo(s)
        </span>
        {typeof stats.conteudosComBncc === "number" ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-800">
            {stats.conteudosComBncc}/{stats.conteudos} conteúdos com BNCC
          </span>
        ) : null}
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
          {stats.selecionadas} BNCC
        </span>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
          {stats.matriz} na matriz
        </span>
      </div>
    </nav>
  );
}

export type { PlanningWizardStep };
