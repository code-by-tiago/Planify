"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { ppEyebrow } from "./theme";

type SystemModule = {
  id: string;
  label: string;
  icon: PlanifyIconName;
  headline: string;
  description: string;
  href: string;
  mockLines: string[];
  mockBadge?: string;
};

const MODULES: SystemModule[] = [
  {
    id: "planejamentos",
    label: "Planejamentos",
    icon: "clipboard",
    headline: "Matriz BNCC em minutos",
    description:
      "Planejamento anual e trimestral alinhado à BNCC, com modelos oficiais em DOCX e exportação Google.",
    href: "/planejamento-escolar-com-ia",
    mockLines: [
      "Habilidade EF05MA03 · Frações",
      "Objetivos de aprendizagem",
      "Sequência didática · 4 semanas",
      "Avaliação formativa",
    ],
    mockBadge: "planify.com.br/planejamentos",
  },
  {
    id: "materiais",
    label: "Materiais",
    icon: "presentation",
    headline: "Aulas e materiais com IA",
    description:
      "Slides, atividades, apostilas e sequências didáticas — revise no editor e exporte ao Google Slides.",
    href: "/gerador-de-atividades-com-ia",
    mockLines: [
      "Apresentação · Frações equivalentes",
      "Slide 1: Introdução visual",
      "Slide 2: Exemplos práticos",
      "Roteiro do professor",
    ],
    mockBadge: "planify.com.br/materiais",
  },
  {
    id: "avaliacoes",
    label: "Avaliações",
    icon: "listChecks",
    headline: "Provas e listas com gabarito",
    description:
      "Questões objetivas e dissertativas com critérios pedagógicos, nível de dificuldade e BNCC taggeada.",
    href: "/gerador-de-provas-com-ia",
    mockLines: [
      "Prova · Matemática · 5º ano",
      "10 questões · gabarito incluso",
      "EF05MA03 · EF05MA07",
      "Banco de questões integrado",
    ],
    mockBadge: "planify.com.br/provas",
  },
  {
    id: "inclusao",
    label: "Inclusão",
    icon: "puzzle",
    headline: "Materiais adaptados para cada aluno",
    description:
      "Adapte atividades para TEA, TDAH, dislexia e diferentes níveis — com IA e critério pedagógico.",
    href: "/dashboard?tipo=inclusao",
    mockLines: [
      "Adaptação · Ana Clara Silva",
      "Legibilidade e formato",
      "Conteúdo e estrutura",
      "Avaliações adaptadas",
    ],
  },
  {
    id: "correcao",
    label: "Correção",
    icon: "pen",
    headline: "Corrija com o seu critério",
    description:
      "Correção de provas e redações com IA — nota, feedback por competência e relatório da turma.",
    href: "/correcao",
    mockLines: [
      "Redação · Ensino Médio",
      "Nota: 8,5 / 10",
      "Feedback por competência",
      "Sugestões de reforço",
    ],
    mockBadge: "planify.com.br/correcao",
  },
  {
    id: "export",
    label: "Export",
    icon: "download",
    headline: "Google Docs e Classroom",
    description:
      "Exporte ao Google Docs, Slides ou Classroom em um clique — sem retrabalho de formatação.",
    href: "/editor-de-documentos-para-professores",
    mockLines: [
      "Editor Planify integrado",
      "Google Docs oficial",
      "Google Classroom",
      "DOCX · PDF",
    ],
  },
  {
    id: "banco",
    label: "Banco",
    icon: "library",
    headline: "Questões organizadas e reutilizáveis",
    description:
      "Monte provas e listas reutilizando questões próprias, da comunidade ou geradas com IA.",
    href: "/dashboard?secao=banco-questoes",
    mockLines: [
      "Banco de questões · Matemática",
      "Filtrar por BNCC e dificuldade",
      "Montar prova em 2 cliques",
      "Compartilhar com a equipe",
    ],
  },
  {
    id: "comunidade",
    label: "Comunidade",
    icon: "market",
    headline: "Professores conectados",
    description:
      "Compartilhe materiais, troque experiências e reutilize modelos de outros docentes.",
    href: "/comunidade",
    mockLines: [
      "Feed da comunidade docente",
      "Sequência · Revolução Industrial",
      "Lista · Equações 1º grau",
      "128 professores online",
    ],
  },
];

export function LandingIntegratedSystem() {
  const [active, setActive] = useState(MODULES[0].id);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    setAnimKey((k) => k + 1);
  }, [active]);

  const current = MODULES.find((m) => m.id === active) ?? MODULES[0];

  return (
    <section id="solucoes" className="pf-marketing-integrated scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className={ppEyebrow}>Ecossistema integrado</p>
          <h2 className="pf-headline mt-3 text-3xl sm:text-4xl lg:text-[2.75rem]">
            Um único sistema
            <br className="hidden sm:block" />
            <span className="text-cyan-600"> de IA integrado.</span>
          </h2>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-10">
          <nav
            className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
            role="tablist"
            aria-label="Módulos do ecossistema Planify"
          >
            {MODULES.map((mod) => {
              const isActive = mod.id === active;
              return (
                <button
                  key={mod.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(mod.id)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-left text-sm font-bold transition lg:w-full ${
                    isActive
                      ? "bg-white text-cyan-800 shadow-sm ring-1 ring-cyan-200"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <PlanifyIcon name={mod.icon} className="h-4 w-4" />
                  </span>
                  {mod.label}
                </button>
              );
            })}
          </nav>

          <div
            key={animKey}
            className="pf-demo-mock flex flex-col"
            role="tabpanel"
            aria-label={current.label}
          >
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 sm:px-6">
              <h3 className="text-xl font-extrabold text-slate-900 sm:text-2xl">{current.headline}</h3>
              <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
                {current.description}
              </p>
              {current.mockBadge ? (
                <p className="mt-3 font-mono text-[11px] font-semibold text-cyan-600/80">
                  {current.mockBadge}
                </p>
              ) : null}
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <ul className="space-y-2.5">
                {current.mockLines.map((line, i) => (
                  <li
                    key={line}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3 text-sm font-medium text-slate-700"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-[10px] font-bold text-cyan-700">
                      {i + 1}
                    </span>
                    {line}
                  </li>
                ))}
              </ul>

              <Link
                href={current.href}
                className="mt-6 inline-flex items-center gap-2 self-start text-sm font-bold text-cyan-700 transition hover:text-cyan-900"
              >
                Saiba mais
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
