import { LandingComparison } from "./LandingComparison";
import { LandingCreateBlock } from "./LandingCreateBlock";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingStats } from "./LandingStats";
import { LandingTeacherProof } from "./LandingTeacherProof";
import { LandingTools } from "./LandingTools";
import { LandingTrustBar } from "./LandingTrustBar";

export function LandingProfessorPrimeiroPage() {
  return (
    <>
      <LandingHeader />
      <LandingHero />
      <LandingTrustBar />
      <LandingStats />
      <LandingCreateBlock />
      <LandingTools />
      <LandingComparison />
      <LandingTeacherProof />
      <LandingHowItWorks />
      <LandingFinalCta />
      <LandingFooter />
    </>
  );
}
