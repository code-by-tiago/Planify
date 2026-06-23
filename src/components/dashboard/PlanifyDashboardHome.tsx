"use client";

import { FormEvent, useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { DashboardSectionId } from "@/lib/pro/dashboardViews";

type PlanifyDashboardHomeProps = {
  initialTopic?: string;
  onTopicChange: (topic: string) => void;
  onOpenSection: (section: DashboardSectionId) => void;
};

export function PlanifyDashboardHome({
  initialTopic = "",
  onTopicChange,
  onOpenSection,
}: PlanifyDashboardHomeProps) {
  const [topic, setTopic] = useState(initialTopic);

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  function persistTopic(value: string) {
    const tema = value.trim();
    onTopicChange(tema);
    if (!tema) return;
    try {
      sessionStorage.setItem("planify-studio-tema", tema);
    } catch {
      /* ignore */
    }
  }

  function handleTopicSubmit(event: FormEvent) {
    event.preventDefault();
    persistTopic(topic);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-lg text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-600">
            Planify · Painel
          </p>
          <h1 className="mt-2 text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            Escolha uma função no menu à esquerda
          </h1>
          <p className="mt-2 text-xs leading-snug text-slate-500">
            Ferramentas com IA, planejamentos, editor, histórico e biblioteca abrem
            aqui no painel — sem rolar a página inteira.
          </p>

          <form
            onSubmit={handleTopicSubmit}
            className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm"
          >
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">
              Tema da aula (opcional)
            </label>
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              onBlur={() => persistTopic(topic)}
              placeholder="Ex.: Frações, Sistema solar, Revolução Industrial…"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              O tema é reutilizado nas ferramentas que você abrir no menu.
            </p>
            <button
              type="button"
              onClick={() => {
                persistTopic(topic);
                onOpenSection("planejamentos");
              }}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-black text-white transition hover:opacity-95"
            >
              <PlanifyIcon name="clipboard" className="h-4 w-4" />
              Abrir planejamentos
            </button>
          </form>

          <p className="mt-6 text-xs font-bold text-slate-400">
            Atalho: pressione <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600">/</kbd> para buscar ferramenta no menu
          </p>
        </div>
      </div>
    </div>
  );
}

export default PlanifyDashboardHome;
