<<<<<<< HEAD
=======
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingHeroTrial } from "./LandingHeroTrial";

>>>>>>> origin/aplicar-melhorias-na-producao
export function LandingHero() {
  return (
    <section
      id="professores"
<<<<<<< HEAD
      className="relative h-[560px] scroll-mt-24 overflow-hidden bg-[#081728] md:h-[617px]"
      aria-labelledby="landing-hero-title"
    >
      <div
        className="absolute inset-0 bg-[url('/marketing/hero-backgrounds/planify-bncc-hero-photo.png')] bg-cover bg-[position:42%_center] md:bg-[url('/marketing/hero-backgrounds/planify-bncc-hero-final.png')] md:bg-center"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-[#081728]/76 md:hidden" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,23,40,0.96)_0%,rgba(8,23,40,0.88)_58%,rgba(8,23,40,0.72)_100%)] md:hidden"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full items-center px-6 text-white md:sr-only">
        <div className="max-w-[350px]">
          <h1
            id="landing-hero-title"
            className="font-[family-name:var(--font-display)] text-[36px] font-extrabold leading-[1.16] tracking-normal"
          >
            Planejamento BNCC
            <br />
            pronto em <span className="text-[#25C8DD]">minutos.</span>
          </h1>
          <p className="mt-5 text-[15px] font-semibold leading-[1.55] text-white">
            Planify é o assistente digital essencial para educadores. Transformamos exigências
            curriculares complexas em materiais prontos para uso através de IA, automatizando a
            burocracia pedagógica.
          </p>
        </div>
=======
      className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-28"
      aria-labelledby="landing-hero-title"
    >
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-[#0A192F]/70">
          <PlanifyIcon name="spark" className="h-3.5 w-3.5 text-[#26C6DA]" />
          Sem cadastro necessário
        </span>

        <h1
          id="landing-hero-title"
          className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.15] tracking-tight text-[#0A192F] sm:text-5xl lg:text-[3.4rem]"
        >
          Escreva o tema da sua aula e veja a{" "}
          <span className="text-[#26C6DA]">mágica</span> acontecer.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-7 text-slate-600 sm:text-lg">
          Escolha a etapa, o ano e a disciplina, digite o tema e gere uma lista de atividades
          alinhada à BNCC, pronta para imprimir. Sem criar conta.
        </p>

        <LandingHeroTrial />
>>>>>>> origin/aplicar-melhorias-na-producao
      </div>
    </section>
  );
}
