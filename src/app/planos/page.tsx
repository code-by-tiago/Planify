import type { Metadata } from "next";
import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PlanCheckoutLink } from "@/components/planos/PlanCheckoutLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { LandingFaq } from "@/components/public/landing/LandingFaq";
import {
  ppBtnPrimary,
  ppEyebrow,
  ppLink,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";
import { billingPlans } from "../../types/billing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Plano Professor — R$ 24,90/mês",
  description:
    "Plano único Planify Professor: geradores com IA, planejamentos BNCC, editor e exportação. Uso ilimitado por R$ 24,90/mês.",
  path: "/planos",
});

type PlanosPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    message?: string;
    premium?: string;
    cadastro?: string;
  }>;
};

function getAlert(params: Awaited<NonNullable<PlanosPageProps["searchParams"]>>) {
  if (params?.premium === "required") {
    return {
      type: "warning",
      title: "Plano ativo necessário",
      message: "Assine o plano Professor para acessar as ferramentas premium.",
    };
  }
  if (params?.cadastro === "ok") {
    return {
      type: "warning",
      title: "Assine para começar",
      message: "Conclua a assinatura abaixo e crie sua senha na tela seguinte.",
    };
  }
  if (params?.checkout === "missing_plan") {
    return {
      type: "warning",
      title: "Assine o plano Professor",
      message: "Inicie o checkout para liberar o acesso.",
    };
  }
  if (params?.checkout === "cancelled") {
    return {
      type: "warning",
      title: "Checkout cancelado",
      message: "Você pode assinar quando quiser.",
    };
  }
  if (params?.checkout === "error") {
    return {
      type: "error",
      title: "Não foi possível iniciar o checkout",
      message:
        params?.message || "Tente novamente em instantes ou fale com o suporte.",
    };
  }
  return null;
}

function alertClass(type: string) {
  if (type === "error") return "border-rose-200 bg-rose-50 text-rose-800";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

const highlights: { icon: PlanifyIconName; label: string }[] = [
  { icon: "spark", label: "Geradores com IA" },
  { icon: "calendar", label: "Planejamentos BNCC" },
  { icon: "editor", label: "Editor e exportação" },
];

const planFaq = [
  {
    question: "O uso é ilimitado?",
    answer:
      "Sim — todas as ferramentas premium, sem créditos ou cotas diárias. Uso pessoal docente, conforme nossos termos.",
  },
  {
    question: "Como começo depois de assinar?",
    answer:
      "Conclua o checkout, crie sua senha na confirmação e entre com o mesmo e-mail em /login.",
  },
  {
    question: "Posso cancelar?",
    answer:
      "Sim, a qualquer momento. O acesso permanece até o fim do período já pago.",
  },
];

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const params = searchParams ? await searchParams : {};
  const alert = getAlert(params);
  const plan = billingPlans[0];

  return (
    <PublicProfessorPrimeiroLayout>
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(8,145,178,0.07),transparent_60%)]"
        />

        <div className="relative mx-auto flex max-w-lg flex-col px-5 pb-20 pt-14 sm:px-8 sm:pt-20">
          {alert ? (
            <div
              className={`mb-8 flex gap-3 rounded-2xl border p-4 ${alertClass(alert.type)}`}
            >
              <PlanifyIcon name="alertCircle" className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">{alert.title}</p>
                <p className="mt-0.5 text-sm leading-6 opacity-90">{alert.message}</p>
              </div>
            </div>
          ) : null}

          <header className="text-center">
            <p className={ppEyebrow}>{plan.name}</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
              IA pedagógica,{" "}
              <span className={ppTitleAccent}>uso ilimitado.</span>
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-base font-medium leading-7 text-slate-600">
              Um plano, acesso completo. Sem comparar pacotes.
            </p>
          </header>

          <article
            id="precos"
            className="scroll-mt-24 mt-10 rounded-3xl border border-slate-200/90 bg-white p-7 shadow-[0_24px_64px_-32px_rgba(15,23,42,0.18)] sm:p-8"
          >
            {plan.badgeLabel ? (
              <span className="inline-block rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                {plan.badgeLabel}
              </span>
            ) : null}

            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight text-slate-950">
                {plan.priceLabel}
              </span>
              <span className="text-sm font-semibold text-slate-500">
                {plan.recurrenceLabel}
              </span>
            </div>

            <ul className="mt-7 space-y-3 border-t border-slate-100 pt-7">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 text-sm font-medium text-slate-700"
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-cyan-600">
                    <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <PlanCheckoutLink
                planKey={plan.key}
                className={`${ppBtnPrimary} flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold`}
              >
                {plan.ctaLabel}
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </PlanCheckoutLink>
              <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                Pagamento seguro via Stripe · Acesso imediato após confirmação
              </p>
            </div>
          </article>

          <ul className="mt-8 grid grid-cols-3 gap-3 text-center">
            {highlights.map((item) => (
              <li
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 px-2 py-4"
              >
                <PlanifyIcon
                  name={item.icon}
                  className="mx-auto h-5 w-5 text-cyan-600"
                />
                <p className="mt-2 text-[11px] font-bold leading-snug text-slate-700 sm:text-xs">
                  {item.label}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center text-sm text-slate-500">
            Já tem conta?{" "}
            <Link href="/login" className={ppLink}>
              Entrar
            </Link>
          </p>

          <div className="mt-14 border-t border-slate-100 pt-10">
            <h2 className="text-center text-lg font-black text-slate-950">
              Dúvidas
            </h2>
            <div className="mt-5">
              <LandingFaq items={planFaq} />
            </div>
          </div>
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
