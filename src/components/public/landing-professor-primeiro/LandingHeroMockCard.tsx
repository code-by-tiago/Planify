import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const STEPS = ["Informações", "BNCC", "Conteúdo", "Revisão"] as const;
const BNCC_CHIPS = ["EF08LP01", "EF08LP02", "EF08LP03", "EF08LP04"] as const;

export function LandingHeroMockCard() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
      <div
        aria-hidden
        className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-8 -left-6 h-28 w-28 rounded-full bg-slate-900/5 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xl shadow-slate-900/10 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-cyan-600">
              Planejamento Anual
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">
              Língua Portuguesa · 8º Ano
            </p>
          </div>
          <span className="rounded-full bg-cyan-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-700 ring-1 ring-cyan-100">
            IA ativa
          </span>
        </div>

        <div className="mt-5 flex gap-1">
          {STEPS.map((step, index) => {
            const active = index <= 2;
            return (
              <div key={step} className="flex-1">
                <div
                  className={`h-1.5 rounded-full ${
                    active ? "bg-cyan-500" : "bg-slate-200"
                  }`}
                />
                <p
                  className={`mt-2 text-[10px] font-semibold ${
                    active ? "text-cyan-700" : "text-slate-400"
                  }`}
                >
                  {step}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Habilidades BNCC
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {BNCC_CHIPS.map((chip) => (
              <span
                key={chip}
                className="rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="h-2 w-full rounded-full bg-slate-100" />
          <div className="h-2 w-4/5 rounded-full bg-slate-100" />
          <div className="h-2 w-3/5 rounded-full bg-cyan-100" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
            <PlanifyIcon name="download" className="h-3.5 w-3.5 text-cyan-600" />
            Gerar DOCX
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
            <PlanifyIcon name="editor" className="h-3.5 w-3.5" />
            Abrir no Editor
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5">
          <PlanifyIcon name="checkCircle" className="h-4 w-4 shrink-0 text-cyan-600" />
          <p className="text-xs font-bold text-cyan-800">Pronto para editar!</p>
        </div>
      </div>
    </div>
  );
}
