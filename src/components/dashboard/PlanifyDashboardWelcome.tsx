"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { planifyToolCount } from "@/lib/pro/planifyTools";

type PlanifyDashboardWelcomeProps = {
  topic?: string;
  onTopicChange?: (topic: string) => void;
};

export function PlanifyDashboardWelcome({
  topic = "",
  onTopicChange,
}: PlanifyDashboardWelcomeProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden bg-white px-6 py-8 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600">
        Planify · IA pedagógica
      </p>
      <h1 className="mt-3 max-w-xl text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
        Materiais de aula com IA,{" "}
        <span className="text-indigo-600">alinhados à BNCC.</span>
      </h1>
      <p className="mt-4 max-w-lg text-sm font-semibold leading-relaxed text-slate-600">
        Escolha uma ferramenta no menu à esquerda. O resultado abre aqui no painel
        — foco total na qualidade do material que você gera e revisa.
      </p>

      {onTopicChange ? (
        <label className="mt-6 block w-full max-w-md text-left">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Tema da aula (opcional)
          </span>
          <input
            value={topic}
            onChange={(event) => onTopicChange(event.target.value)}
            placeholder="Ex.: Ciclo da água, Frações, Revolução Industrial…"
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
          />
        </label>
      ) : null}

      <ul className="mt-8 flex max-w-md flex-col gap-2 text-left text-sm font-semibold text-slate-600">
        <li className="flex items-start gap-2">
          <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          {planifyToolCount} ferramentas no menu lateral — um clique para abrir
        </li>
        <li className="flex items-start gap-2">
          <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          BNCC, editor e exportação DOCX no mesmo fluxo
        </li>
        <li className="flex items-start gap-2">
          <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          Sem distrações: só o que importa é o material pronto
        </li>
      </ul>
    </div>
  );
}

export default PlanifyDashboardWelcome;
