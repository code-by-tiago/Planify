"use client";

import { useEffect, useState } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

const TABS = [
  {
    id: "planejamentos",
    label: "Planejamentos",
    icon: "clipboard" as const,
    mock: {
      title: "Matriz BNCC · 5º ano",
      rows: ["Habilidade EF05MA03", "Objetivos de aprendizagem", "Sequência didática", "Avaliação formativa"],
    },
  },
  {
    id: "materiais",
    label: "Materiais",
    icon: "presentation" as const,
    mock: {
      title: "Apresentação · Frações",
      rows: ["Slide 1: Introdução", "Slide 2: Exemplos visuais", "Slide 3: Atividade prática", "Roteiro do professor"],
    },
  },
  {
    id: "correcao",
    label: "Correção",
    icon: "pen" as const,
    mock: {
      title: "Prova · Matemática",
      rows: ["Nota: 8,5/10", "Feedback por questão", "Sugestões de reforço", "Devolutiva para aluno"],
    },
  },
  {
    id: "export",
    label: "Export",
    icon: "download" as const,
    mock: {
      title: "Exportar material",
      rows: ["Editor Planify", "Google Docs oficial", "Google Classroom", "DOCX / PDF"],
    },
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function LandingProductDemoTabs() {
  const [active, setActive] = useState<TabId>("planejamentos");
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [active]);

  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="pf-demo-mock w-full">
      <div
        className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/80 p-2"
        role="tablist"
        aria-label="Demonstração do produto"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
                isActive
                  ? "bg-white text-cyan-700 shadow-sm ring-1 ring-cyan-200"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
              }`}
            >
              <PlanifyIcon name={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div key={animKey} className="pf-demo-tab-panel p-4 sm:p-6" role="tabpanel">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
            <PlanifyIcon name={current.icon} className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">Prévia animada</p>
            <p className="text-sm font-extrabold text-slate-900">{current.mock.title}</p>
          </div>
        </div>
        <ul className="space-y-2">
          {current.mock.rows.map((row, i) => (
            <li
              key={row}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-sm font-medium text-slate-700"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-[10px] font-bold text-cyan-700">
                {i + 1}
              </span>
              {row}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 px-3 py-2 text-xs font-semibold text-cyan-800">
          <PlanifyIcon name="spark" className="h-3.5 w-3.5" />
          Gerado com IA · alinhado à BNCC · pronto para exportar
        </div>
      </div>
    </div>
  );
}

export default LandingProductDemoTabs;
