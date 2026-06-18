import { LandingComunidadeDocente } from "./LandingComunidadeDocente";
import { LandingComparison } from "./LandingComparison";
import { LandingFeatureGrid } from "./LandingFeatureGrid";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingPremiumSplit } from "./LandingPremiumSplit";
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
      <LandingFeatureGrid />
      <LandingPremiumSplit />
      <LandingComunidadeDocente />
      <LandingTestimonials />
      <LandingFinalCta />
      <LandingFooter />
    </>
  );
}
