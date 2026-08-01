import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PlanCheckoutLink } from "@/components/planos/PlanCheckoutLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingFaq } from "@/components/public/landing/LandingFaq";
import { PlanosQueryAlert } from "./PlanosQueryAlert";
import {
  ppBadge,
  ppBtnPrimary,
  ppLink,
} from "@/components/public/landing-professor-primeiro/theme";
import { billingPlans } from "../../types/billing";

export const metadata: Metadata = buildPageMetadata({
  title: "Plano Professor — R$ 24,90/mês",
  description:
    "Planify Professor: ferramentas com IA, planejamentos BNCC, editor e exportação em um plano completo por R$ 24,90/mês.",
  path: "/planos",
});

const planFaq = [
  {
    question: "O que está incluído?",
    answer:
      "Ferramentas com IA, Planejamentos BNCC, editor, biblioteca, exportações e Comunidade Docente — tudo em uma assinatura.",
  },
  {
    question: "Como começo depois de assinar?",
    answer:
      "Conclua o checkout, crie sua senha na confirmação e entre com o mesmo e-mail em /login.",
  },
  {
    question: "Posso cancelar?",
    answer:
      "Sim, a qualquer momento. O acesso permanece ativo até o fim do período já pago.",
  },
];

export default function PlanosPage() {
  const plan = billingPlans[0];

  return (
    <PublicProfessorPrimeiroLayout>
      <section className="relative overflow-hidden px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(ellipse_80%_60%_at_80%_15%,rgba(8,145,178,0.06),transparent_50%)] sm:block"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden opacity-40 bg-[radial-gradient(circle_at_25%_35%,rgba(8,145,178,0.05),transparent_40%),radial-gradient(circle_at_72%_28%,rgba(71,85,105,0.04),transparent_36%)] sm:block"
        />

        <div className="relative mx-auto max-w-6xl">
          <Suspense fallback={null}>
            <PlanosQueryAlert />
          </Suspense>

          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <span className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-800">
                Plano único para professores
              </span>

              <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem]">
                Menos tempo montando.{" "}
                <span className="text-cyan-600">Mais tempo ensinando.</span>
              </h1>

              <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600">
                Ferramentas com IA, planejamentos BNCC e exportação — uma assinatura
                simples, sem pacotes para comparar.
              </p>
            </div>

            <article
              id="precos"
              className="scroll-mt-24 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_64px_-32px_rgba(8,145,178,0.28)] sm:p-8 lg:sticky lg:top-24"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  {plan.badgeLabel ? (
                    <span className={ppBadge}>{plan.badgeLabel}</span>
                  ) : null}
                  <h2 className="mt-4 text-xl font-black tracking-tight text-slate-950">
                    {plan.name}
                  </h2>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                  <PlanifyIcon name="spark" className="h-5 w-5" />
                </span>
              </div>

              <p className="mt-3 text-sm font-medium leading-6 text-slate-600">{plan.description}</p>

              <div className="mt-7 rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50/80 via-white to-sky-50/60 px-5 py-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-cyan-700">
                  Investimento mensal
                </p>
                <div className="mt-2 flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                    {plan.priceLabel}
                  </span>
                  <span className="mb-1.5 text-sm font-semibold text-slate-600">
                    {plan.recurrenceLabel}
                  </span>
                </div>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  Uma assinatura. Todas as ferramentas essenciais para a sua rotina docente.
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-semibold text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <PlanCheckoutLink
                  planKey={plan.key}
                  className={`${ppBtnPrimary} flex w-full items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold`}
                >
                  {plan.ctaLabel}
                  <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                </PlanCheckoutLink>
                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  Checkout protegido pelo Stripe · acesso liberado após a confirmação.
                </p>
                <p className="mt-2 text-center text-xs leading-5 text-slate-500">
                  Já pagou?{" "}
                  <Link href="/planos/ativar" className="font-bold text-cyan-700 hover:text-cyan-800">
                    Criar senha com o e-mail do pagamento
                  </Link>
                </p>
              </div>
            </article>
          </div>

          <div className="mx-auto mt-16 max-w-2xl">
            <h2 className="text-center text-lg font-black tracking-tight text-slate-950">
              Dúvidas frequentes
            </h2>
            <div className="mt-5">
              <LandingFaq items={planFaq} />
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-slate-500">
            Já tem uma conta? <Link href="/login" className={ppLink}>Entrar</Link>
          </p>
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
