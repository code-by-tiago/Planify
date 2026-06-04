"use client";

import { TeachyLessonPreview } from "@/components/public/landing/TeachyLessonPreview";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type PlanifyDashboardWelcomeProps = {
  topic?: string;
  onTopicChange?: (topic: string) => void;
};

export function PlanifyDashboardWelcome({
  topic = "",
  onTopicChange,
}: PlanifyDashboardWelcomeProps) {
  const displayTopic = topic.trim() || "Sua aula";
  const lessonTitle = `${displayTopic} — Aula 1`;

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col justify-center px-5 py-5 sm:px-8 lg:max-w-[46%] lg:py-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
          Planify · IA pedagógica
        </p>
        <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
          Materiais de aula com IA,{" "}
          <span className="text-indigo-600">alinhados à BNCC.</span>
        </h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
          Escolha uma ferramenta no menu à esquerda. O material abre aqui, na
          mesma tela — sem rolar a página.
        </p>

        {onTopicChange ? (
          <label className="mt-5 block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-500">
              Tema da aula
            </span>
            <input
              value={topic}
              onChange={(event) => onTopicChange(event.target.value)}
              placeholder="Ex.: Ciclo da água, Frações…"
              className="mt-1.5 h-11 w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </label>
        ) : null}

        <p className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-400">
          <PlanifyIcon name="spark" className="h-3.5 w-3.5 text-indigo-500" />
          13 ferramentas · um painel · exportação DOCX
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 lg:border-l lg:border-t-0">
        <TeachyLessonPreview variant="hero" title={lessonTitle} />
      </div>
    </div>
  );
}

export default PlanifyDashboardWelcome;
