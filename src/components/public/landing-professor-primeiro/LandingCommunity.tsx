import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { COMMUNITY_DIFFERENTIATION, COMMUNITY_FEATURES } from "./constants";
import { ppBtnPrimary, ppBtnSecondary, ppEyebrow } from "./theme";

const accentRing: Record<string, string> = {
  cyan: "border-cyan-400/25 bg-cyan-50/60 text-cyan-700",
  emerald: "border-emerald-400/25 bg-emerald-50/60 text-emerald-700",
  violet: "border-violet-400/25 bg-violet-50/60 text-violet-700",
};

export function LandingCommunity() {
  return (
    <section
      id="comunidade"
      className="scroll-mt-24 border-y border-slate-200/80 bg-gradient-to-b from-white via-violet-50/30 to-white px-5 py-16 sm:px-8 sm:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className={ppEyebrow}>Comunidade</p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold text-slate-900 sm:text-4xl">
            Mini rede social entre professores premium
          </h2>
          <p className="mt-4 text-base font-medium leading-7 text-slate-600">
            Compartilhe materiais com colegas, descubra modelos reais de sala de aula e reutilize
            com segurança — sem loja, sem venda, só troca entre pares.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITY_FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="pl-hud-glass flex flex-col rounded-2xl border border-violet-400/15 p-5 transition hover:border-violet-300/40"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-sm shadow-violet-500/20">
                <PlanifyIcon name={feature.icon as PlanifyIconName} className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-extrabold text-slate-900">{feature.title}</h3>
              <p className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-14">
          <p className="text-center text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Onde cada espaço se encaixa
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {COMMUNITY_DIFFERENTIATION.map((item) => (
              <article
                key={item.title}
                className={`pl-hud-glass rounded-2xl border p-5 ${accentRing[item.accent]}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 ring-1 ring-black/5">
                  <PlanifyIcon name={item.icon as PlanifyIconName} className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-extrabold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/planos" className={ppBtnPrimary}>
            Começar na comunidade
          </Link>
          <Link href="/dashboard?secao=marketplace" className={ppBtnSecondary}>
            Explorar o feed
          </Link>
        </div>
      </div>
    </section>
  );
}
