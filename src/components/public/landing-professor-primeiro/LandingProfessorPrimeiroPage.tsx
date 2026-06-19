import { PlanifyMarketingLayout } from "@/components/planify-layout";
import { LandingEcosystem } from "./LandingEcosystem";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingHero } from "./LandingHero";
import { LandingIntegratedSystem } from "./LandingIntegratedSystem";
import { LandingSocialProof } from "./LandingSocialProof";
import { LandingStudioFeatures } from "./LandingStudioFeatures";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingTools } from "./LandingTools";

/**
 * Homepage pública — arquitetura marketing premium:
 * Hero → Sistema integrado → Stats → Studio → Ecossistema → Ferramentas → Depoimentos → CTA
 */
export function LandingProfessorPrimeiroPage() {
  return (
    <PlanifyMarketingLayout>
      <LandingHero />
      <LandingIntegratedSystem />
      <LandingSocialProof />
      <LandingStudioFeatures />
      <LandingEcosystem />
      <LandingTools />
      <LandingTestimonials />
      <LandingFinalCta />
    </PlanifyMarketingLayout>
  );
}
