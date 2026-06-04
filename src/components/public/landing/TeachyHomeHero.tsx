import Link from "next/link";

export function TeachyHomeHero() {
  return (
    <section className="pl-teachy-hero relative overflow-hidden bg-white">
      <div className="mx-auto max-w-3xl px-5 py-12 text-center sm:px-8 lg:py-16">
        <h1 className="text-[2.35rem] font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.4rem]">
          Assistente de IA para{" "}
          <span className="pl-teachy-gradient-text">professores.</span>
        </h1>
        <p className="mt-6 text-lg font-medium leading-8 text-slate-600">
          Junte-se a milhares de educadores que economizam horas por semana com
          IA para criar slides personalizados, aulas completas, provas e
          materiais alinhados à BNCC — com exportação em DOCX oficial no
          Planify.
        </p>
        <Link
          href="/dashboard"
          className="pl-teachy-cta mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-slate-900 shadow-sm transition hover:brightness-95"
        >
          Comece grátis
        </Link>
      </div>
    </section>
  );
}
