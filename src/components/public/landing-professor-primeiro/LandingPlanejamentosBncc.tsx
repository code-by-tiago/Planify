import Link from "next/link";
import { LandingHeroLiveDashboard } from "./LandingHeroLiveDashboard";
import { ppBtnPrimary, ppEyebrow } from "./theme";

const STEPS = [
  "Professor informa os conteúdos da unidade",
  "IA sugere habilidades BNCC compatíveis",
  "Professor revisa e aprova as habilidades",
  "Planejamento anual ou trimestral é gerado automaticamente",
] as const;

export function LandingPlanejamentosBncc() {
  return (
    <section id="planejamentos" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className={ppEyebrow}>Planejamentos BNCC</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Do conteúdo ao planejamento oficial em minutos
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Informe o que vai ensinar. A IA cruza com a matriz curricular e monta o
            planejamento anual ou trimestral — com metodologias, avaliações e semanas
            distribuídas, pronto para exportar nos modelos oficiais.
          </p>

          <ol className="mt-8 space-y-4" role="list">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-black text-cyan-800">
                  {index + 1}
                </span>
                <span className="pt-0.5 text-sm font-semibold leading-6 text-slate-700">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <Link href="/planejamento-escolar-com-ia" className={`${ppBtnPrimary} mt-8 inline-flex`}>
            Criar planejamento
          </Link>
        </div>

        <LandingHeroLiveDashboard />
      </div>
    </section>
  );
}
