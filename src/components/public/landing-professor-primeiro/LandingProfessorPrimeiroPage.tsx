import { TeachyMarketingLayout } from "@/components/teachy-layout";
import { LandingComunidadeDocente } from "./LandingComunidadeDocente";
import { LandingComparison } from "./LandingComparison";
import { LandingFeatureGrid } from "./LandingFeatureGrid";
import { LandingFinalCta } from "./LandingFinalCta";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingPremiumSplit } from "./LandingPremiumSplit";
import { LandingSocialProof } from "./LandingSocialProof";
import { LandingTestimonials } from "./LandingTestimonials";
import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { planifyToolCount } from "@/lib/pro/planifyTools";
import { ppBtnSecondary, ppEyebrow } from "./theme";

function LandingEcosystemStrip() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/80 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <p className={ppEyebrow}>Ecossistema Planify</p>
        <h2 className="pf-headline mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Feito para professores — não para alunos
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600">
          Planeje, crie, corrija e exporte sem alternar entre dezenas de ferramentas. Portal
          aluno/família omitido de propósito: foco total no docente.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="pf-chip pf-chip--active">
            <PlanifyIcon name="user" className="h-3.5 w-3.5" />
            Professores
          </span>
          <span className="pf-chip">
            <PlanifyIcon name="clipboard" className="h-3.5 w-3.5" />
            Escolas & gestores
          </span>
        </div>
      </div>
    </section>
  );
}

function LandingToolsTeaser() {
  return (
    <section className="px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl text-center">
        <p className={ppEyebrow}>{planifyToolCount} ferramentas IA</p>
        <h2 className="pf-headline mt-3 text-3xl font-extrabold text-slate-900">
          Catálogo completo de geradores
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-slate-600">
          Slides, provas, listas, planejamentos BNCC, inclusão, correção e mais — explore o catálogo
          público antes de criar conta.
        </p>
        <Link href="/ferramentas" className={`${ppBtnSecondary} mt-8 inline-flex gap-2`}>
          Ver catálogo
          <PlanifyIcon name="arrowRight" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export function LandingProfessorPrimeiroPage() {
  return (
    <TeachyMarketingLayout>
      <LandingHero />
      <LandingSocialProof />
      <LandingEcosystemStrip />
      <LandingHowItWorks />
      <LandingComparison />
      <LandingFeatureGrid />
      <LandingToolsTeaser />
      <LandingPremiumSplit />
      <LandingComunidadeDocente />
      <LandingTestimonials />
      <LandingFinalCta />
    </TeachyMarketingLayout>
  );
}
