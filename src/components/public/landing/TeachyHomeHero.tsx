import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyHudHeroVisual } from "@/components/public/landing/PlanifyHudHeroVisual";
import {
  landingGeneratorCount,
  teachyPartnerLabels,
} from "@/lib/pro/teachyLanding";

const heroStats = [
  { value: `${landingGeneratorCount}+`, label: "Geradores IA" },
  { value: "BNCC", label: "Alinhamento curricular" },
  { value: "Google Docs", label: "Modelo oficial" },
  { value: "Classroom", label: "Publicação direta" },
] as const;

export function TeachyHomeHero() {
  return (
    <section className="pl-hud-hero pl-hud-landing-hero relative isolate overflow-hidden">
      <div className="pl-hud-landing-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="pl-hud-landing-grid pointer-events-none absolute inset-0" aria-hidden />

      <div className="pl-hud-landing-hero-grid relative mx-auto max-w-7xl">
        <div className="pl-hud-landing-hero-content">
          <div className="pl-hud-landing-hero-badges">
            <span className="pl-hud-badge">
              <PlanifyIcon name="spark" className="h-3 w-3" />
              IA pedagógica para professores
            </span>
            <span className="pl-hud-landing-hero-badge-secondary">
              BNCC · Google Classroom
            </span>
          </div>

          <h1 className="pl-hud-display pl-hud-landing-hero-title">
            Materiais pedagógicos com IA{" "}
            <span className="pl-hud-gradient-text">alinhados à BNCC.</span>
          </h1>
          <p className="pl-hud-landing-hero-subtitle">
            Planejamentos, slides, provas e atividades estruturados para você revisar no editor —
            com BNCC local, Material Engine e exportação ao Google Docs, Slides e Classroom.
          </p>

          <div className="pl-hud-landing-hero-ctas">
            <Link href="/planos" className="pl-hud-btn pl-hud-landing-hero-cta-primary">
              Começar agora
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="/#ferramentas" className="pl-hud-btn-secondary pl-hud-landing-hero-cta-secondary">
              Ver ferramentas
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="/login" className="pl-hud-landing-hero-cta-ghost">
              Entrar
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
          </div>

          <div className="pl-hud-landing-stats">
            {heroStats.map((stat) => (
              <div key={stat.label} className="pl-hud-landing-stat">
                <span className="pl-hud-landing-stat-value">{stat.value}</span>
                <span className="pl-hud-landing-stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pl-hud-landing-hero-visual">
          <PlanifyHudHeroVisual />
        </div>
      </div>

      <div className="pl-hud-landing-trust-strip">
        <div className="pl-hud-landing-trust mx-auto max-w-7xl">
          {teachyPartnerLabels.map((label) => (
            <span key={label} className="pl-hud-landing-trust-item">
              <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5 shrink-0 text-cyan-700" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
