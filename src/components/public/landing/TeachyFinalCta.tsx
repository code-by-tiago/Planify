import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

export function TeachyFinalCta() {
  return (
    <section id="planos" className="scroll-mt-28 bg-slate-50 py-16 sm:py-24">
      <div className="pl-hud-cta-band mx-auto max-w-5xl px-6 py-14 text-center sm:px-10 sm:py-16">
        <h2 className="pl-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Pronta para usar o Planify na sua rotina?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg font-medium leading-8 opacity-90">
          Escolha um plano, libere os geradores premium e continue no mesmo
          painel que você viu aqui.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/planos"
            className="pl-hud-btn inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold"
          >
            Ver planos
            <PlanifyIcon name="arrowRight" className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="pl-hud-btn-ghost inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition"
          >
            Entrar
          </Link>
        </div>
      </div>
    </section>
  );
}
