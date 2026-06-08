import { LandingCreateBlock } from "./LandingCreateBlock";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingResources } from "./LandingResources";
import { LandingTestimonials } from "./LandingTestimonials";
import { LandingTrustBar } from "./LandingTrustBar";

export function LandingProfessorPrimeiroPage() {
  return (
    <>
      <LandingHeader />
      <LandingHero />
      <LandingTrustBar />
      <LandingCreateBlock />
      <LandingResources />
      <LandingHowItWorks />
      <LandingTestimonials />
      <LandingFinalCta />
      <LandingFooter />
    </>
  );
}
