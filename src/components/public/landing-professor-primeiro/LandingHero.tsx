import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingHeroDashboardMock } from "./LandingHeroDashboardMock";
import { LandingHeroFlowBar } from "./LandingHeroFlowBar";
import { LandingHeroStatsBar } from "./LandingHeroStatsBar";
import { ppBtnPrimary, ppBtnSecondary } from "./theme";

const AVATAR_COLORS = ["#3B82F6", "#10B981", "#8B5CF6"];

export function LandingHero() {
  return (
    <>
      <section id="professores" className="pf-marketing-hero pf-marketing-hero--light scroll-mt-24">
        <div className="pf-marketing-hero-inner pf-marketing-hero-inner--split">
          <div className="pf-marketing-hero-copy">
            <Link href="#professores" className="pf-marketing-hero-back-label">
              ← IR PARA PROFESSORES
            </Link>

            <h1 className="pf-marketing-hero-title pf-marketing-hero-title--light">
              <span className="pf-marketing-hero-title-line">Menos tempo</span>
              <span className="pf-marketing-hero-title-line">planejando.</span>
              <span className="pf-marketing-hero-title-line pf-marketing-hero-title-accent">
                Mais qualidade
              </span>
              <span className="pf-marketing-hero-title-line pf-marketing-hero-title-accent">
                ensinando.
              </span>
            </h1>

            <p className="pf-marketing-lead pf-marketing-lead--hero mt-6">
              Planejamentos alinhados à BNCC, materiais didáticos, correção com IA, editor
              integrado e envio para o Google Classroom.
            </p>

            <div className="pf-marketing-hero-actions mt-8 flex flex-wrap gap-3">
              <Link href="/cadastro" className={`${ppBtnPrimary} gap-2 px-6 py-3`}>
                Começar agora — grátis
              </Link>
              <Link
                href="/#demo"
                className={`${ppBtnSecondary} pf-marketing-hero-outline gap-2 px-6 py-3`}
              >
                <PlanifyIcon name="presentation" className="h-4 w-4" />
                Ver demonstração
              </Link>
            </div>

            <div className="pf-marketing-hero-rating mt-8 flex flex-wrap items-center gap-3">
              <div className="pf-marketing-hero-avatars" aria-hidden>
                {AVATAR_COLORS.map((color, index) => (
                  <span
                    key={color}
                    className="pf-marketing-hero-avatar"
                    style={{
                      backgroundColor: color,
                      zIndex: AVATAR_COLORS.length - index,
                    }}
                  />
                ))}
              </div>
              <div className="pf-marketing-hero-stars" aria-label="Avaliação 4,9 de 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="pf-marketing-hero-star">
                    ★
                  </span>
                ))}
              </div>
              <span className="pf-marketing-hero-rating-score">4,9 de 5</span>
              <span className="pf-marketing-hero-rating-divider" aria-hidden>
                ·
              </span>
              <span className="pf-marketing-hero-rating-count">+2.500 professores recomendam</span>
            </div>
          </div>

          <div className="pf-marketing-hero-visual">
            <LandingHeroFlowBar />
            <LandingHeroDashboardMock />
          </div>
        </div>

        <LandingHeroStatsBar />
      </section>
    </>
  );
}
