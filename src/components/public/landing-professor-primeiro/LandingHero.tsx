import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { landingPartnerLabels } from "@/lib/pro/planifyLanding";
import { ppBtnPrimary, ppBtnSecondary } from "./theme";

const AUDIENCE_PILLS = [
  {
    id: "professores",
    label: "Professores",
    description: "Planeje, crie e corrija com IA",
    href: "/cadastro",
    active: true,
    icon: "user" as const,
  },
  {
    id: "escolas",
    label: "Escolas & gestores",
    description: "Padronize equipes e modelos oficiais",
    href: "/escolas",
    active: false,
    icon: "clipboard" as const,
  },
] as const;

export function LandingHero() {
  return (
    <>
      <section id="professores" className="pf-marketing-hero scroll-mt-24">
        <div className="pf-marketing-hero-bg" aria-hidden />
        <img
          className="pf-marketing-hero-image"
          src="/images/planify-saas-hero-v1.png"
          alt=""
          aria-hidden
        />

        <div className="pf-marketing-hero-inner">
          <div className="pf-marketing-hero-copy flex max-w-[480px] flex-col items-start text-left">
            <p className="pf-marketing-hero-eyebrow">Planeje · Crie · Revise · Compartilhe</p>
            <h1 className="pf-marketing-hero-title">Conteúdo → BNCC → Planejamento → Editor → Classroom</h1>

            <p className="pf-marketing-lead pf-marketing-lead--hero mt-6 max-w-[480px]">
              A plataforma pedagógica com IA que conecta planejamento, materiais, revisão e
              publicação na turma — sem retrabalho entre ferramentas.
            </p>

            <div className="pf-marketing-hero-actions mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className={`${ppBtnPrimary} gap-2 px-6 py-3`}>
                Começar grátis
                <PlanifyIcon name="arrowRight" className="h-5 w-5" />
              </Link>
              <Link
                href="/#jornada"
                className={`${ppBtnSecondary} pf-marketing-hero-outline px-6 py-3`}
              >
                Ver a jornada
              </Link>
            </div>

            <div
              className="pf-marketing-hero-proof mt-8 flex flex-wrap gap-2"
              aria-label="Principais benefícios"
            >
              <span>18 ferramentas conectadas</span>
              <span>BNCC, editor e Google Docs</span>
              <span>Experiência de plataforma, não chatbot</span>
            </div>

            <div className="pf-marketing-hero-kpis" aria-label="Destaques da plataforma">
              <div>
                <strong>10x</strong>
                <span>mais velocidade para transformar ideia em material pronto</span>
              </div>
              <div>
                <strong>1 fluxo</strong>
                <span>do planejamento à exportação editável</span>
              </div>
              <div>
                <strong>BNCC</strong>
                <span>como base do produto, não detalhe decorativo</span>
              </div>
            </div>

            <nav
              className="pf-marketing-audience-nav mt-10 hidden lg:flex"
              aria-label="Planify para"
            >
              {AUDIENCE_PILLS.map((pill) => (
                <Link
                  key={pill.id}
                  href={pill.href}
                  className={`pf-marketing-audience-card ${pill.active ? "is-active" : ""}`}
                >
                  <span className="pf-marketing-audience-card-icon">
                    <PlanifyIcon name={pill.icon} className="h-6 w-6" />
                  </span>
                  <span className="text-left">
                    <span className="block text-sm font-bold">{pill.label}</span>
                    <span className="block text-xs font-normal opacity-80">{pill.description}</span>
                  </span>
                </Link>
              ))}
            </nav>

            <div className="pf-marketing-audience-pills mt-8 lg:hidden">
              {AUDIENCE_PILLS.map((pill) => (
                <Link
                  key={pill.id}
                  href={pill.href}
                  className={`pf-marketing-audience-pill ${pill.active ? "is-active" : ""}`}
                >
                  {pill.label}
                </Link>
              ))}
            </div>

            <Link
              href="/cadastro"
              className={`${ppBtnPrimary} pf-marketing-hero-legacy-cta mt-8 gap-2 px-6 py-3`}
            >
              Acesse grátis
              <PlanifyIcon name="arrowRight" className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="pf-marketing-trust-strip">
        <div className="pf-marketing-trust-strip-inner">
          {landingPartnerLabels.map((label) => (
            <span key={label} className="pf-marketing-trust-item">
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
