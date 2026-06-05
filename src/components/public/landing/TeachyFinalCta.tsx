import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

export function TeachyFinalCta() {
  return (
    <section id="planos" className="scroll-mt-28 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Pronta para usar o Planify na sua rotina?
        </h2>
        <p className="mt-4 text-lg font-medium leading-8 text-slate-600">
          Escolha um plano, libere os geradores premium e continue no mesmo
          painel que você viu aqui.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/planos"
            className="pl-teachy-cta inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-bold text-slate-900"
          >
            Ver planos
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
