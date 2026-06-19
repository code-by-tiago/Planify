import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { landingPartnerLabels } from "@/lib/pro/planifyLanding";
import { ppBtnPrimary } from "./theme";

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

        <div className="pf-marketing-hero-inner">
          <div className="mx-auto flex max-w-[1120px] flex-col items-center text-center">
            <h1 className="pf-marketing-hero-title">
              <span className="block">All-in-one </span>
              <span className="pf-marketing-gradient-word pf-marketing-hero-title-accent">IA</span>
              <br />
              <span className="block">Learning System</span>
            </h1>

            <p className="pf-marketing-lead pf-marketing-lead--hero mx-auto mt-6 max-w-2xl">
              Junte-se a milhares de educadores com planejamentos BNCC, materiais com IA, correção e
              exportação Google — tudo num só lugar, feito para o docente brasileiro.
            </p>

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

            <Link href="/cadastro" className={`${ppBtnPrimary} mt-8 gap-2 px-6 py-3`}>
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
