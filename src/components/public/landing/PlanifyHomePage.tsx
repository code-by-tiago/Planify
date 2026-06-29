import { LandingFaq } from "@/components/public/landing/LandingFaq";
import { TeachyCommunitySection } from "@/components/public/landing/TeachyCommunitySection";
import { TeachyFinalCta } from "@/components/public/landing/TeachyFinalCta";
import { InclusionFocusSection } from "@/components/public/landing/InclusionFocusSection";
import { LessonSimulatorSection } from "@/components/public/landing/LessonSimulatorSection";
import { TeachyHomeFeatures } from "@/components/public/landing/TeachyHomeFeatures";
import { TeachyHomeHero } from "@/components/public/landing/TeachyHomeHero";
import { TeachyHomeToolsGrid } from "@/components/public/landing/TeachyHomeToolsGrid";
import { TeachyPartnersBar } from "@/components/public/landing/TeachyPartnersBar";

const faqItems = [
  {
    question: "Preciso saber usar inteligência artificial?",
    answer:
      "Não. Descreva o tema, etapa e componente em português — o Planify estrutura o material pedagógico para você revisar.",
  },
  {
    question: "Os materiais seguem a BNCC?",
    answer:
      "Sim. Habilidades e competências são sugeridas conforme etapa, ano/série e componente curricular.",
  },
  {
    question: "O Planify envia para o Google Classroom?",
    answer:
      "Sim. No editor, conecte o Google: o Planify salva o material no Drive, lista suas turmas reais e publica no Classroom apos sua confirmacao.",
  },
  {
    question: "Como começo?",
    answer:
      "Crie sua conta, escolha um plano e libere os geradores premium com uso ilimitado.",
  },
];

/** Landing pública espelhando a estrutura Teachy /professores */
export function PlanifyHomePage() {
  return (
    <>
      <TeachyHomeHero />
      <LessonSimulatorSection />
      <InclusionFocusSection />
      <TeachyHomeFeatures />
      <TeachyHomeToolsGrid />
      <TeachyCommunitySection />
      <TeachyPartnersBar />
      <TeachyFinalCta />

      <section id="faq" className="scroll-mt-28 border-t border-cyan-400/15 bg-[var(--planify-canvas)] py-16 sm:pb-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <h2 className="pl-display text-center text-2xl font-extrabold text-slate-950">
            Perguntas frequentes
          </h2>
          <div className="mt-8">
            <LandingFaq items={faqItems} />
          </div>
        </div>
      </section>
    </>
  );
}
