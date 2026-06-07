import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { dashboardToolHref } from "@/lib/pro/toolRoutes";

const INCLUSION_BULLETS: {
  icon: PlanifyIconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "puzzle",
    title: "Adaptação para TEA (Autismo)",
    description: "Rotinas visuais e comandos claros.",
  },
  {
    icon: "listChecks",
    title: "Materiais para TDAH",
    description: "Textos objetivos, tópicos destacados e exercícios focados.",
  },
  {
    icon: "fileText",
    title: "Dislexia e Baixa Visão",
    description: "Formatação limpa e suporte a fontes amigáveis.",
  },
];

export function InclusionFocusSection() {
  return (
    <section
      id="inclusao"
      className="pl-hud-landing-inclusion-section relative isolate scroll-mt-28 overflow-hidden py-4 sm:py-6"
      aria-labelledby="inclusion-focus-heading"
    >
      <div className="pl-hud-landing-inclusion-band mx-auto max-w-[calc(100%-2rem)] sm:max-w-7xl">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:py-20">
          <div>
            <span className="pl-hud-badge inline-flex items-center gap-1.5">
              <PlanifyIcon name="spark" className="h-3 w-3" />
              Inclusão
            </span>
            <h2
              id="inclusion-focus-heading"
              className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-[2.5rem] lg:text-5xl"
            >
              Educação inclusiva ao alcance de{" "}
              <span className="pl-hud-gradient-text">um clique</span>
            </h2>
            <p className="mt-5 max-w-lg text-lg font-medium leading-8 text-slate-600">
              A única ferramenta que adapta materiais para as necessidades específicas de cada
              aluno de forma humanizada.
            </p>

            <ul className="mt-8 space-y-4" role="list">
              {INCLUSION_BULLETS.map((item) => (
                <li key={item.title} className="pl-hud-landing-inclusion-bullet flex gap-4">
                  <span
                    className="pl-hud-landing-inclusion-bullet-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    aria-hidden
                  >
                    <PlanifyIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 pt-0.5">
                    <span className="block text-base font-bold text-slate-950">{item.title}</span>
                    <span className="mt-0.5 block text-sm font-medium leading-6 text-slate-600">
                      {item.description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href={dashboardToolHref("inclusao")}
              className="pl-hud-btn mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold"
            >
              Adaptar material agora
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <div className="relative w-full min-w-0">
            <div
              className="pl-hud-landing-inclusion-window"
              role="img"
              aria-label="Painel Planify IA para adaptação inclusiva de materiais"
            >
              <div className="pl-hud-landing-inclusion-window-chrome">
                <span className="pl-hud-landing-inclusion-window-dot" aria-hidden />
                <span className="pl-hud-landing-inclusion-window-dot" aria-hidden />
                <span className="pl-hud-landing-inclusion-window-dot" aria-hidden />
                <span className="pl-hud-landing-inclusion-window-title">Planify IA — Inclusão</span>
              </div>

              <div className="pl-hud-landing-inclusion-panel">
                <p className="pl-hud-landing-inclusion-panel-label">Modo de adaptação</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="pl-hud-landing-inclusion-chip pl-hud-landing-inclusion-chip--active">
                    Adaptação de Atividades
                  </span>
                  <span className="pl-hud-landing-inclusion-chip">Trilhas Paralelas</span>
                </div>

                <p className="pl-hud-landing-inclusion-panel-label mt-5">Necessidade do aluno</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="pl-hud-landing-inclusion-chip pl-hud-landing-inclusion-chip--active">
                    TEA
                  </span>
                  <span className="pl-hud-landing-inclusion-chip">TDAH</span>
                  <span className="pl-hud-landing-inclusion-chip">Dislexia</span>
                </div>

                <p className="pl-hud-landing-inclusion-panel-label mt-5">Conteúdo original</p>
                <div className="pl-hud-landing-inclusion-field mt-2" aria-hidden>
                  <span className="pl-hud-landing-inclusion-field-line pl-hud-landing-inclusion-field-line--short" />
                  <span className="pl-hud-landing-inclusion-field-line" />
                  <span className="pl-hud-landing-inclusion-field-line pl-hud-landing-inclusion-field-line--medium" />
                </div>

                <div className="mt-6 flex justify-end">
                  <span className="pl-hud-landing-inclusion-btn-active pl-hud-btn inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold">
                    ✨ Adaptar Material para Inclusão
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
