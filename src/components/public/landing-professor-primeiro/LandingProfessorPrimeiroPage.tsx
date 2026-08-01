<<<<<<< HEAD
=======
import { LandingComparison } from "./LandingComparison";
>>>>>>> origin/aplicar-melhorias-na-producao
import { LandingCreateBlock } from "./LandingCreateBlock";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
<<<<<<< HEAD
=======
import { LandingProcessSteps } from "./LandingProcessSteps";
import { LandingProductFaq } from "./LandingProductFaq";
import { LandingResources } from "./LandingResources";
import { LandingReveal } from "./LandingReveal";
import { LandingTeacherProof } from "./LandingTeacherProof";
>>>>>>> origin/aplicar-melhorias-na-producao
import { LandingTools } from "./LandingTools";
import { LandingTrustBar } from "./LandingTrustBar";

export function LandingProfessorPrimeiroPage() {
  return (
    <>
      <LandingHeader />
      <LandingHero />
      <LandingTrustBar />
      <LandingTools />
      <LandingCreateBlock />
<<<<<<< HEAD
      <LandingHowItWorks />
      <LandingFinalCta />
=======
      <LandingReveal>
        <LandingProcessSteps />
      </LandingReveal>
      <LandingReveal>
        <LandingComparison />
      </LandingReveal>
      <LandingReveal>
        <LandingTeacherProof />
      </LandingReveal>
      <LandingReveal>
        <LandingHowItWorks />
      </LandingReveal>
      <LandingReveal>
        <LandingResources />
      </LandingReveal>
      <LandingReveal>
        <LandingProductFaq />
      </LandingReveal>
      <LandingReveal>
        <LandingFinalCta />
      </LandingReveal>
>>>>>>> origin/aplicar-melhorias-na-producao
      <LandingFooter />
    </>
  );
}
