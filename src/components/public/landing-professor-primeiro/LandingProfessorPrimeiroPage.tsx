import { PlanifyMarketingLayout } from "@/components/planify-layout";
import { LandingComparison } from "./LandingComparison";
import { LandingComunidadeDocente } from "./LandingComunidadeDocente";
import { LandingCorrecaoSection } from "./LandingCorrecaoSection";
import { LandingEditorSection } from "./LandingEditorSection";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingHero } from "./LandingHero";
import { LandingHeroLiveDashboard } from "./LandingHeroLiveDashboard";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingJourneySection } from "./LandingJourneySection";
import { LandingMateriaisDidaticos } from "./LandingMateriaisDidaticos";
import { LandingPlanejamentosBncc } from "./LandingPlanejamentosBncc";
import { LandingSocialProof } from "./LandingSocialProof";
import { LandingTestimonials } from "./LandingTestimonials";

/**
 * Homepage pública — jornada pedagógica premium:
 * Hero → Demo → Prova social → Como funciona → Antes/depois → Jornada →
 * Planeje/Crie/Revise/Compartilhe → Comunidade → Depoimentos → CTA
 */
export function LandingProfessorPrimeiroPage() {
  return (
    <PlanifyMarketingLayout>
      <LandingHero />
      <LandingHeroLiveDashboard />
      <LandingSocialProof />
      <LandingHowItWorks />
      <LandingComparison />
      <LandingJourneySection />
      <LandingPlanejamentosBncc />
      <LandingMateriaisDidaticos />
      <LandingEditorSection />
      <LandingCorrecaoSection />
      <LandingComunidadeDocente />
      <LandingTestimonials />
      <LandingFinalCta />
    </PlanifyMarketingLayout>
  );
}
