import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { ppEyebrow } from "./theme";

const JOURNEY_PHASES = [
  {
    id: "planeje",
    label: "Planeje",
    tagline: "BNCC e planejamentos oficiais",
    icon: "clipboard" as PlanifyIconName,
    href: "/cadastro",
    highlights: ["Matriz anual e trimestral", "Habilidades sugeridas", "Google Docs oficial"],
  },
  {
    id: "crie",
    label: "Crie",
    tagline: "Materiais didáticos com IA",
    icon: "spark" as PlanifyIconName,
    href: "/cadastro",
    highlights: ["Atividades e provas", "Slides e apostilas", "Jogos pedagógicos"],
  },
  {
    id: "revise",
    label: "Revise",
    tagline: "Editor e correção inteligente",
    icon: "editor" as PlanifyIconName,
    href: "/editor-de-documentos-para-professores",
    highlights: ["Editor integrado", "Correção IA", "Adaptação inclusiva"],
  },
  {
    id: "compartilhe",
    label: "Compartilhe",
    tagline: "Turma, biblioteca e comunidade",
    icon: "externalLink" as PlanifyIconName,
    href: "/login",
    highlights: ["Google Classroom", "Biblioteca escolar", "Comunidade docente"],
  },
] as const;

export function LandingJourneySection() {
  return (
    <section id="jornada" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Sua jornada</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Planeje → Crie → Revise → Compartilhe
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Um fluxo contínuo — do conteúdo à turma — sem trocar de ferramenta a cada etapa.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {JOURNEY_PHASES.map((phase, index) => (
            <article
              key={phase.id}
              className="pf-journey-card group relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-300/60 hover:shadow-lg hover:shadow-cyan-500/10"
            >
              {index < JOURNEY_PHASES.length - 1 ? (
                <span
                  className="pointer-events-none absolute -right-3 top-1/2 hidden -translate-y-1/2 text-cyan-300 lg:block"
                  aria-hidden
                >
                  <PlanifyIcon name="arrowRight" className="h-5 w-5" />
                </span>
              ) : null}
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                <PlanifyIcon name={phase.icon} className="h-5 w-5" />
              </span>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-600">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-950">{phase.label}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{phase.tagline}</p>
              <ul className="mt-4 flex-1 space-y-2" role="list">
                {phase.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-xs font-medium leading-5 text-slate-600"
                  >
                    <PlanifyIcon
                      name="checkCircle"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-500"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={phase.href}
                className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-cyan-700 transition group-hover:gap-1.5"
              >
                Explorar
                <PlanifyIcon name="arrowRight" className="h-3.5 w-3.5" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
