"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LumiMascot } from "@/components/pro/LumiMascot";
import { lessonBundleTools, teachyWorkflowSteps } from "@/lib/pro/teachyStudio";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

type TeachyStudioHomeProps = {
  onSelectTool: (toolId: PlanifyToolId) => void;
  initialTopic?: string;
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function TeachyStudioHome({
  onSelectTool,
  initialTopic = "",
}: TeachyStudioHomeProps) {
  const router = useRouter();
  const [topic, setTopic] = useState(initialTopic);

  useEffect(() => {
    setTopic(initialTopic);
  }, [initialTopic]);

  function handleLessonSubmit(event: FormEvent) {
    event.preventDefault();
    const tema = topic.trim();
    if (!tema) return;
    router.push(`/planejamentos?${new URLSearchParams({ tema }).toString()}`);
  }

  function openToolFromTopic(toolId: PlanifyToolId) {
    const tema = topic.trim();
    if (tema) {
      try {
        sessionStorage.setItem("planify-studio-tema", tema);
      } catch {
        /* ignore */
      }
    }
    onSelectTool(toolId);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f4f6fb]">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain px-4 py-6 sm:px-8">
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <LumiMascot size={52} animated withAura />
            <div>
              <p className="text-sm font-black text-indigo-600">
                {greeting()}, professora
              </p>
              <p className="text-xs font-semibold text-slate-500">
                Escolha uma ferramenta na barra lateral ou comece pelo tema
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Assistente IA para sua aula
          </h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
            Digite o tema abaixo ou selecione uma ferramenta à esquerda. O
            conteúdo abre neste painel, sem sair da tela.
          </p>

          <form onSubmit={handleLessonSubmit} className="mt-6">
            <label className="sr-only" htmlFor="studio-tema">
              Tema da aula
            </label>
            <textarea
              id="studio-tema"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={3}
              placeholder="Ex.: Ciclo da água, Revolução Industrial, Frações…"
              className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-md transition hover:bg-indigo-700"
              >
                <PlanifyIcon name="layers" className="h-4 w-4" />
                Construtor de aula (BNCC)
              </button>
              <Link
                href="/planejamentos"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-indigo-200"
              >
                <PlanifyIcon name="clipboard" className="h-4 w-4" />
                Planejamentos
              </Link>
            </div>
          </form>

          {topic.trim() ? (
            <div className="mt-6 rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-indigo-700">
                Pacote sugerido · {topic.trim()}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lessonBundleTools.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openToolFromTopic(item.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-white"
                  >
                    <PlanifyIcon
                      name={item.icon}
                      className="h-4 w-4 text-indigo-500"
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {teachyWorkflowSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5"
              >
                <span className="text-[10px] font-black text-indigo-600">
                  {step.step}. {step.title}
                </span>
                <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
