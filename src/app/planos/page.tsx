import type { Metadata } from "next";
import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PlanCheckoutLink } from "@/components/planos/PlanCheckoutLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { LandingFaq } from "@/components/public/landing/LandingFaq";
import {
  ppBadge,
  ppBtnPrimary,
  ppBtnSecondary,
  ppEyebrow,
  ppLink,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";
import { billingPlans } from "../../types/billing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Plano Professor — R$ 24,90/mês",
  description:
    "Planify Professor: ferramentas com IA, planejamentos BNCC, editor e exportação em um plano completo por R$ 24,90/mês.",
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
      message: "Assine o Plano Professor para acessar as ferramentas premium.",
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
      title: "Assine o Plano Professor",
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

const valuePillars: { icon: PlanifyIconName; title: string; text: string }[] = [
  {
    icon: "spark",
    title: "Crie em minutos",
    text: "Materiais, avaliações e planejamentos para a sua turma.",
  },
  {
    icon: "calendar",
    title: "Planeje com segurança",
    text: "Planejamentos anuais, trimestrais e de aula alinhados à BNCC.",
  },
  {
    icon: "editor",
    title: "Revise e entregue",
    text: "Editor, biblioteca e exportações para finalizar no seu padrão.",
  },
];

const activationSteps = [
  {
    number: "01",
    title: "Assine com segurança",
    text: "Conclua o checkout protegido em poucos passos.",
  },
  {
    number: "02",
    title: "Ative sua conta",
    text: "Crie a senha no e-mail de confirmação e entre no Planify.",
  },
  {
    number: "03",
    title: "Comece pela sua aula",
    text: "Escolha uma ferramenta, informe o tema e revise o resultado antes de usar.",
  },
];

const planFaq = [
  {
    question: "O uso é ilimitado?",
    answer:
      "Sim — todas as ferramentas premium ficam disponíveis no Plano Professor, sem comparar pacotes. O uso é pessoal docente e segue nossos termos.",
  },
  {
    question: "O que está incluído?",
    answer:
      "Você tem acesso às ferramentas com IA, Planejamentos BNCC, editor, biblioteca, exportações e Comunidade Docente em uma única assinatura.",
  },
  {
    question: "Como começo depois de assinar?",
    answer:
      "Conclua o checkout, crie sua senha na confirmação e entre com o mesmo e-mail em /login. Seu espaço estará pronto para começar.",
  },
  {
    question: "Posso cancelar?",
    answer:
      "Sim, a qualquer momento. O acesso permanece ativo até o fim do período já pago.",
  },
];

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const params = searchParams ? await searchParams : {};
  const alert = getAlert(params);
  const plan = billingPlans[0];

  return (
    <PublicProfessorPrimeiroLayout>
      <section className="relative overflow-hidden bg-white pb-20 pt-12 sm:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_68%_48%_at_18%_0%,rgba(8,145,178,0.13),transparent_70%),radial-gradient(ellipse_48%_38%_at_90%_10%,rgba(37,99,235,0.1),transparent_72%)]"
        />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          {alert ? (
            <div
              className={`mx-auto mb-8 flex max-w-3xl gap-3 rounded-2xl border p-4 ${alertClass(alert.type)}`}
            >
              <PlanifyIcon name="alertCircle" className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="text-sm font-bold">{alert.title}</p>
                <p className="mt-0.5 text-sm leading-6 opacity-90">{alert.message}</p>
              </div>
            </div>
          ) : null}

          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)] lg:gap-14">
            <header className="max-w-2xl">
              <p className={ppEyebrow}>Plano único para professores</p>
              <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-extrabold leading-[1.04] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Menos tempo montando. <span className={ppTitleAccent}>Mais tempo ensinando.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg font-medium leading-8 text-slate-600">
                Tudo que você precisa para planejar, criar, revisar e entregar aulas melhores —
                reunido em uma assinatura simples.
              </p>

              <div className="mt-7 flex flex-wrap gap-2">
                <span className={ppBadge}>
                  <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                  Acesso completo
                </span>
                <span className={ppBadge}>
                  <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                  Sem pacotes para comparar
                </span>
                <span className={ppBadge}>
                  <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                  Cancele quando quiser
                </span>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {valuePillars.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm shadow-slate-200/40 backdrop-blur"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                      <PlanifyIcon name={item.icon} className="h-4 w-4" />
                    </span>
                    <h2 className="mt-3 text-sm font-black text-slate-950">{item.title}</h2>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </header>

            <article
              id="precos"
              className="scroll-mt-24 relative overflow-hidden rounded-[2rem] border border-cyan-200/80 bg-white p-6 shadow-[0_32px_80px_-38px_rgba(8,145,178,0.45)] sm:p-8"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
              />
              <div className="flex items-start justify-between gap-4">
                <div>
                  {plan.badgeLabel ? (
                    <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      {plan.badgeLabel}
                    </span>
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

              <div className="mt-7 rounded-2xl bg-slate-950 px-5 py-5 text-white">
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black tracking-tight sm:text-5xl">{plan.priceLabel}</span>
                  <span className="mb-1.5 text-sm font-semibold text-slate-300">{plan.recurrenceLabel}</span>
                </div>
                <p className="mt-2 text-xs font-medium leading-5 text-slate-300">
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
              </div>
            </article>
          </div>

          <section className="mt-16 rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-7 sm:px-8 sm:py-9">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={ppEyebrow}>Uma rotina mais leve</p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Do planejamento à entrega, sem trocar de plataforma.
                </h2>
              </div>
              <Link href="/login" className={`${ppBtnSecondary} shrink-0 px-5 py-3 text-sm`}>
                Já sou assinante
              </Link>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {activationSteps.map((step) => (
                <article key={step.number} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <span className="text-xs font-black tracking-[0.16em] text-cyan-700">{step.number}</span>
                  <h3 className="mt-3 text-base font-black text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{step.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className={ppEyebrow}>Assinatura sem labirinto</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                Clareza antes, durante e depois do checkout.
              </h2>
              <p className="mt-4 text-base font-medium leading-7 text-slate-600">
                Um único plano evita comparação artificial. Você sabe exatamente o que libera e
                como começar a usar.
              </p>
              <PlanCheckoutLink
                planKey={plan.key}
                className={`${ppBtnPrimary} mt-7 w-full sm:w-auto`}
              >
                Começar agora
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </PlanCheckoutLink>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="text-xl font-black text-slate-950">Perguntas frequentes</h2>
              <div className="mt-4">
                <LandingFaq items={planFaq} />
              </div>
            </div>
          </section>

          <p className="mt-12 text-center text-sm text-slate-500">
            Já tem uma conta? <Link href="/login" className={ppLink}>Entrar</Link>
          </p>
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
