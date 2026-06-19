import { TeachyMarketingLayout } from "@/components/teachy-layout";
import { LandingEcosystem } from "./LandingEcosystem";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingHero } from "./LandingHero";
import { LandingIntegratedSystem } from "./LandingIntegratedSystem";
import { LandingSocialProof } from "./LandingSocialProof";
import { LandingStudioFeatures } from "./LandingStudioFeatures";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingTools } from "./LandingTools";

/**
 * Homepage pública — arquitetura espelhando Teachy MarketingHome:
 * Hero → Sistema integrado → Ecossistema → Stats → Studio → Ferramentas → Depoimentos → CTA
 */
export function LandingProfessorPrimeiroPage() {
  return (
    <TeachyMarketingLayout>
      <LandingHero />
      <LandingIntegratedSystem />
      <LandingEcosystem />
      <LandingSocialProof />
      <LandingStudioFeatures />
      <LandingTools />
      <LandingTestimonials />
      <LandingFinalCta />
    </TeachyMarketingLayout>
  );
}
