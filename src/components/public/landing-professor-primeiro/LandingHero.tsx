import Link from "next/link";
import { LandingHeroLaptopMockup } from "./LandingHeroLaptopMockup";
import { ppBtnPrimary, ppBtnSecondary } from "./theme";

export function LandingHero() {
  return (
    <section
      id="professores"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-[#F0F9FA] via-[#F0F9FA]/60 to-white px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14"
    >
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.2] tracking-tight text-[#0A192F] sm:text-5xl lg:text-[3.15rem]">
            Planejamento BNCC pronto em minutos.
          </h1>

          <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600">
            Informe os conteúdos, aprove as habilidades BNCC sugeridas e gere planejamentos
            anuais ou trimestrais completos, prontos para editar, exportar ou enviar.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/testar-planejamento" className={ppBtnPrimary}>
              Testar planejamento grátis
            </Link>
            <Link href="/planos" className={ppBtnSecondary}>
              Começar agora
            </Link>
          </div>
        </div>

        <div className="relative lg:-mb-8">
          <LandingHeroLaptopMockup />
        </div>
      </div>
    </section>
  );
}
