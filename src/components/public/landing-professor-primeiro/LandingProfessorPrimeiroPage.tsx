import { InclusionFocusSection } from "@/components/public/landing/InclusionFocusSection";
import { LandingComunidadeDocente } from "./LandingComunidadeDocente";
import { LandingComparison } from "./LandingComparison";
import { LandingCorrecaoSection } from "./LandingCorrecaoSection";
import { LandingEditorSection } from "./LandingEditorSection";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingMateriaisDidaticos } from "./LandingMateriaisDidaticos";
import { LandingPlanejamentosBncc } from "./LandingPlanejamentosBncc";
import { LandingSocialProof } from "./LandingSocialProof";
import { LandingTestimonials } from "./LandingTestimonials";

export function LandingProfessorPrimeiroPage() {
  return (
    <>
      <LandingHeader />
      <LandingHero />
      <LandingSocialProof />
      <LandingHowItWorks />
      <LandingComparison />
      <LandingPlanejamentosBncc />
      <LandingMateriaisDidaticos />
      <LandingEditorSection />
      <LandingCorrecaoSection />
      <InclusionFocusSection />
      <LandingComunidadeDocente />
      <LandingTestimonials />
      <LandingFinalCta />
      <LandingFooter />
    </>
  );
}
