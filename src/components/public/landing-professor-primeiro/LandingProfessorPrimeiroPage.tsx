import { LandingComparison } from "./LandingComparison";
import { LandingCreateBlock } from "./LandingCreateBlock";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingResources } from "./LandingResources";
import { LandingSchoolLogos } from "./LandingSchoolLogos";
import { LandingStats } from "./LandingStats";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingTrustBar } from "./LandingTrustBar";

export function LandingProfessorPrimeiroPage() {
  return (
    <>
      <LandingHeader />
      <LandingHero />
      <LandingTrustBar />
      <LandingStats />
      <LandingCreateBlock />
      <LandingResources />
      <LandingHowItWorks />
      <LandingSchoolLogos />
      <LandingComparison />
      <LandingTestimonials />
      <LandingFinalCta />
      <LandingFooter />
    </>
  );
}
