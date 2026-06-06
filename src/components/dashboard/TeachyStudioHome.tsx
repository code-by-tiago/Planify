"use client";

import type { DashboardSectionId } from "@/lib/pro/dashboardViews";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  planifyTools,
  type PlanifyToolId,
} from "@/lib/pro/planifyTools";

type TeachyStudioHomeProps = {
  onSelectTool: (toolId: PlanifyToolId) => void;
  onSelectSection?: (sectionId: DashboardSectionId) => void;
  initialTopic?: string;
  onTopicChange?: (topic: string) => void;
};

export default function TeachyStudioHome({
  onSelectTool,
  onSelectSection,
  initialTopic = "",
  onTopicChange,
}: TeachyStudioHomeProps) {
  function persistTopicForTool() {
    const tema = initialTopic.trim();
    if (!tema) return;
    try {
      sessionStorage.setItem("planify-studio-tema", tema);
    } catch {
      /* ignore */
    }
    onTopicChange?.(tema);
  }

  function openTool(toolId: PlanifyToolId) {
    persistTopicForTool();
    onSelectTool(toolId);
  }

  function openPlanejamentos() {
    persistTopicForTool();
    onSelectSection?.("planejamentos");
  }

  return (
    <div className="pl-hud-hub pl-hud-board pl-hud-home flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <header className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-600">
              Ferramentas IA · BNCC
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              O que vamos criar hoje?
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium text-slate-600">
              Escolha uma ferramenta para gerar materiais alinhados à BNCC.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={openPlanejamentos}
              className="pl-hud-hub-app group flex min-h-[9.5rem] flex-col rounded-2xl p-5 text-left sm:min-h-[10.5rem]"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm">
                <PlanifyIcon name="clipboard" className="h-6 w-6" />
              </span>
              <span className="mt-4 text-lg font-extrabold text-slate-950">
                Planejamentos
              </span>
              <span className="mt-1.5 text-sm font-medium leading-snug text-slate-600">
                Matriz BNCC anual ou trimestral · DOCX oficial
              </span>
              <span className="mt-auto pt-3 text-xs font-semibold text-cyan-700 group-hover:underline">
                Abrir →
              </span>
            </button>

            {planifyTools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => openTool(tool.id)}
                className="pl-hud-hub-app group flex min-h-[9.5rem] flex-col rounded-2xl p-5 text-left sm:min-h-[10.5rem]"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
                >
                  <PlanifyIcon name={tool.icon} className="h-6 w-6" />
                </span>
                <span className="mt-4 text-lg font-extrabold text-slate-950">
                  {tool.shortTitle}
                </span>
                <span className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug text-slate-600">
                  {tool.description}
                </span>
                {tool.popular ? (
                  <span className="mt-2 inline-flex w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                    Popular
                  </span>
                ) : null}
                <span className="mt-auto pt-3 text-xs font-semibold text-cyan-700 group-hover:underline">
                  Abrir →
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
