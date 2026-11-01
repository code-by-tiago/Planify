import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingHeroAccess } from "./LandingHeroAccess";

export function LandingHero() {
  return (
    <section
      id="professores"
      className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-28"
      aria-labelledby="landing-hero-title"
    >
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#0A192F]/70">
          <PlanifyIcon name="spark" className="h-3.5 w-3.5 text-[#26C6DA]" />
          Acesso com conta Google
        </span>

        <h1
          id="landing-hero-title"
          className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.15] tracking-tight text-[#0A192F] sm:text-5xl lg:text-[3.4rem]"
        >
          Planeje aulas melhores com{" "}
          <span className="text-[#26C6DA]">inteligência pedagógica</span>.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
          O Planify reúne planejamento, materiais, avaliações e exportações em um único
          ambiente para professores e escolas.
        </p>

        <LandingHeroAccess />
      </div>
    </section>
  );
}
