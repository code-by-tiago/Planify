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
    <div className="pl-dashboard-welcome flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden bg-white px-6 py-8 text-center">
      <p className="pl-dashboard-eyebrow text-[10px] font-black uppercase tracking-[0.22em] text-[var(--pl-teal-deep)]">
        Planify · Centro operacional
      </p>
      <h1 className="mt-3 max-w-2xl text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
        Planeje, crie, revise e{" "}
        <span className="text-[var(--pl-teal)]">compartilhe</span> em um só lugar
      </h1>
      <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-slate-600">
        {planifyToolCount} ferramentas conectadas — BNCC, editor, histórico, biblioteca e
        Google Classroom no mesmo fluxo pedagógico.
      </p>

      {onTopicChange ? (
        <label className="mt-6 block w-full max-w-md text-left">
          <span className="text-xs font-black uppercase tracking-wide text-slate-500">
            Tema da aula (opcional)
          </span>
          <input
            value={topic}
            onChange={(event) => onTopicChange(event.target.value)}
            placeholder="Ex.: Ciclo da água, Frações, Revolução Industrial..."
            className="mt-1.5 h-11 w-full rounded-xl border border-[var(--pl-border-teal)] bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-[var(--pl-teal)] focus:bg-white focus:ring-4 focus:ring-cyan-100"
          />
        </label>
      ) : null}

      <ul className="pl-dashboard-proof mt-8 grid max-w-3xl gap-3 text-left text-sm font-semibold text-slate-600 sm:grid-cols-3">
        <li className="flex items-start gap-2">
          <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pl-teal)]" />
          Jornada clara no menu lateral
        </li>
        <li className="flex items-start gap-2">
          <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pl-teal)]" />
          BNCC, editor e exportação Google Docs
        </li>
        <li className="flex items-start gap-2">
          <PlanifyIcon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pl-teal)]" />
          Materiais prontos para revisar e publicar
        </li>
      </ul>
    </div>
  );
}

export default PlanifyDashboardWelcome;
