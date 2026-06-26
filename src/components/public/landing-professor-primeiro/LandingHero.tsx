import Link from "next/link";
import { LandingHeroVideo } from "./LandingHeroVideo";
import { ppBtnPrimary, ppBtnSecondary } from "./theme";

export function LandingHero() {
  return (
    <section
      id="professores"
      className="relative scroll-mt-24 overflow-hidden px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_60%_at_80%_15%,rgba(8,145,178,0.06),transparent_50%)] sm:block"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 hidden opacity-40 bg-[radial-gradient(circle_at_25%_35%,rgba(8,145,178,0.05),transparent_40%),radial-gradient(circle_at_72%_28%,rgba(71,85,105,0.04),transparent_36%)] sm:block"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-800">
            Planejamento BNCC com IA
          </span>

          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
            Planejamento BNCC{" "}
            <span className="text-cyan-600">pronto em minutos.</span>
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
              Ver planos
            </Link>
          </div>
        </div>

        <LandingHeroVideo />
      </div>
    </section>
  );
}
