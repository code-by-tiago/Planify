import type { Metadata } from "next";
import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { ReferralCapture } from "@/components/referral/ReferralCapture";
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
    "Plano Planify Professor: geradores com IA, planejamentos BNCC, editor e exportação. Acesso completo com cota diária de gerações profundas.",
  path: "/planos",
});

type PlanosPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    message?: string;
    premium?: string;
    cadastro?: string;
    ref?: string;
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
  return type === "error"
    ? "border-rose-200 bg-rose-50 text-rose-800"
    : "border-amber-200 bg-amber-50 text-amber-800";
}

const valuePillars: {
  icon: PlanifyIconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "spark",
    title: "Crie com contexto",
    description:
      "Transforme tema, turma e objetivo em materiais prontos para revisar.",
  },
  {
    icon: "calendar",
    title: "Planeje com segurança",
    description:
      "Organize matrizes e planejamentos alinhados à BNCC no mesmo ambiente.",
  },
  {
    icon: "editor",
    title: "Finalize do seu jeito",
    description:
      "Edite, complemente e exporte antes de levar qualquer material à turma.",
  },
];

const planFlow: { step: string; title: string; description: string }[] = [
  {
    step: "01",
    title: "Escolha a ferramenta",
    description: "Plano, slides, atividade, prova, lista e muito mais.",
  },
  {
    step: "02",
    title: "Informe o contexto",
    description: "O Planify considera etapa, turma, disciplina e tema.",
  },
  {
    step: "03",
    title: "Revise e compartilhe",
    description: "Ajuste no editor e exporte quando o material estiver com a sua cara.",
  },
];

const planFaq = [
  {
    question: "O uso é ilimitado?",
    answer:
      "Você tem acesso a todas as ferramentas premium. Gerações profundas (listas, provas, slides, planejamentos etc.) têm cota diária — 5 por dia no plano Professor, com reinício à meia-noite (horário de Brasília). Exportação, editor e revisão não consomem essa cota.",
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
      <ReferralCapture referralCode={params.ref} />
      <main className="relative isolate overflow-hidden bg-[#f8fbfd]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[38rem] bg-[radial-gradient(ellipse_70%_58%_at_52%_0%,rgba(8,145,178,0.15),transparent_72%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-[-14rem] top-[30rem] -z-10 h-96 w-96 rounded-full bg-cyan-100/40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-12rem] top-[50rem] -z-10 h-96 w-96 rounded-full bg-blue-100/45 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:pb-28">
          {alert ? (
            <div
              className={[
                "mx-auto mb-8 flex max-w-3xl gap-3 rounded-2xl border p-4 shadow-sm",
                alertClass(alert.type),
              ].join(" ")}
              role="status"
            >
              <PlanifyIcon name="alertCircle" className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">{alert.title}</p>
                <p className="mt-0.5 text-sm leading-6 opacity-90">{alert.message}</p>
              </div>
            </div>
          ) : null}

          <section className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-14 xl:grid-cols-[minmax(0,1fr)_29rem]">
            <div className="max-w-3xl">
              <p className={ppEyebrow}>Plano Professor</p>
              <h1 className="mt-5 max-w-3xl font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[0.98] tracking-[-0.055em] text-slate-950 sm:text-5xl lg:text-6xl">
                Mais tempo para ensinar.
                <span className={[ppTitleAccent, "mt-2 block"].join(" ")}>
                  Menos tempo começando do zero.
                </span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600">
                Um único plano para criar, planejar, revisar e exportar materiais
                pedagógicos com uma IA que acompanha a sua rotina.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#assinar"
                  className={[ppBtnPrimary, "inline-flex items-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold"].join(" ")}
                >
                  Ver o plano
                  <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-5 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:text-cyan-800"
                >
                  Já sou assinante
                  <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>

              <dl className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">Acesso</dt>
                  <dd className="mt-1 text-sm font-black text-slate-950">Todas as ferramentas</dd>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">Ritmo claro</dt>
                  <dd className="mt-1 text-sm font-black text-slate-950">{plan.creditsLabel}</dd>
                </div>
                <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                  <dt className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-700">Controle final</dt>
                  <dd className="mt-1 text-sm font-black text-slate-950">Editor e exportação</dd>
                </div>
              </dl>
            </div>

            <article
              id="assinar"
              className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_75px_-38px_rgba(15,23,42,0.4)] sm:p-8"
            >
              <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">{plan.name}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{plan.description}</p>
                </div>
                {plan.badgeLabel ? (
                  <span className="shrink-0 rounded-full bg-cyan-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-800">
                    {plan.badgeLabel}
                  </span>
                ) : null}
              </div>

              <div className="mt-7 flex items-end gap-2">
                <span className="text-5xl font-black tracking-[-0.06em] text-slate-950">{plan.priceLabel}</span>
                <span className="pb-1 text-sm font-bold text-slate-500">{plan.recurrenceLabel}</span>
              </div>

              <div className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                <div className="flex items-center gap-2 text-sm font-black text-cyan-950">
                  <PlanifyIcon name="spark" className="h-4 w-4 text-cyan-700" />
                  Inclui {plan.creditsLabel}
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-cyan-800">
                  Você acompanha um limite simples por dia e continua com editor,
                  exportação e revisão sem consumir essa cota.
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-5 text-slate-700">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                      <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                    </span>
                    <span className="font-semibold">{feature}</span>
                  </li>
                ))}
              </ul>

              <PlanCheckoutLink
                planKey={plan.key}
                className={[ppBtnPrimary, "mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold"].join(" ")}
              >
                {plan.ctaLabel}
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </PlanCheckoutLink>
              <p className="mt-3 text-center text-xs font-medium leading-5 text-slate-500">
                Checkout seguro via Stripe · Acesso liberado após a confirmação.
              </p>
            </article>
          </section>

          <section className="mt-20 sm:mt-24">
            <div className="max-w-2xl">
              <p className={ppEyebrow}>Uma assinatura, um fluxo completo</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.045em] text-slate-950 sm:text-4xl">
                O trabalho pedagógico continua
                <span className={[ppTitleAccent, "block"].join(" ")}>depois do primeiro rascunho.</span>
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {valuePillars.map((item) => (
                <article
                  key={item.title}
                  className="group rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.34)] transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_25px_55px_-36px_rgba(8,145,178,0.35)]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-700">
                    <PlanifyIcon name={item.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 text-lg font-black tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-16 grid gap-8 rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_-42px_rgba(15,23,42,0.8)] sm:mt-20 sm:px-8 sm:py-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Do tema à sala de aula</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold leading-tight tracking-[-0.045em] sm:text-4xl">
                Uma rotina leve, sem perder o seu critério.
              </h2>
              <p className="mt-4 max-w-md text-sm font-medium leading-6 text-slate-300">
                A IA cuida do primeiro rascunho. Você permanece no comando das decisões
                pedagógicas e do material que chega à turma.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-3">
              {planFlow.map((item) => (
                <li key={item.step} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                  <span className="text-xs font-black tracking-[0.14em] text-cyan-300">{item.step}</span>
                  <h3 className="mt-5 text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-300">{item.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="mx-auto mt-20 max-w-3xl sm:mt-24">
            <div className="text-center">
              <p className={ppEyebrow}>Dúvidas frequentes</p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-[-0.04em] text-slate-950 sm:text-4xl">
                Tudo claro antes de começar.
              </h2>
            </div>
            <div className="mt-8"><LandingFaq items={planFaq} /></div>
            <p className="mt-10 text-center text-sm font-medium text-slate-500">
              Já tem conta?{" "}
              <Link href="/login" className={ppLink}>Entrar no Planify</Link>
            </p>
          </section>
        </div>
      </main>
    </PublicProfessorPrimeiroLayout>
  );
}
