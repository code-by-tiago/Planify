import type { Metadata } from "next";
import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PlanCheckoutLink } from "@/components/planos/PlanCheckoutLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingFaq } from "@/components/public/landing/LandingFaq";
import {
  ppBadge,
  ppBtnGhost,
  ppBtnPrimary,
  ppBtnSecondary,
  ppCtaBand,
  ppEyebrow,
  ppIconBox,
  ppLead,
  ppLink,
  ppPlanHighlight,
  ppSectionAlt,
  ppTitle,
  ppTitleAccent,
} from "@/components/public/landing-professor-primeiro/theme";
import { billingPlans } from "../../types/billing";
import { landingPublicToolCount } from "@/lib/pro/teachyLanding";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Planos e preços",
  description:
    "Planos Pro e Premium do Planify IA Educacional: geradores com IA, planejamentos BNCC, editor integrado, biblioteca e exportação Google Docs para professores.",
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
      message:
        "Sua conta foi identificada, mas é necessário ter um plano ativo para acessar as ferramentas premium.",
    };
  }

  if (params?.cadastro === "ok") {
    return {
      type: "success",
      title: "Conta criada",
      message:
        "Conta pronta! Escolha Pro ou Premium abaixo para iniciar o checkout e liberar os geradores IA.",
    };
  }

  if (params?.checkout === "missing_plan") {
    return {
      type: "warning",
      title: "Escolha um plano",
      message:
        "Selecione Pro mensal, Premium ou Pro anual para iniciar o checkout com segurança.",
    };
  }

  if (params?.checkout === "cancelled") {
    return {
      type: "warning",
      title: "Checkout cancelado",
      message:
        "Você pode escolher um plano novamente quando quiser continuar.",
    };
  }

  if (params?.checkout === "error") {
    return {
      type: "error",
      title: "Não foi possível iniciar o checkout",
      message:
        params?.message ||
        "Tente novamente em instantes. Se o problema persistir, fale com o suporte.",
    };
  }

  return null;
}

function alertClass(type: string) {
  if (type === "success") {
    return "border-cyan-200 bg-cyan-50 text-cyan-800";
  }

  if (type === "error") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

const guarantees = [
  {
    title: "Pagamento seguro",
    description: "Checkout processado com segurança e dados protegidos.",
    icon: "lock" as const,
  },
  {
    title: "Créditos controlados",
    description: "Acompanhe o uso de créditos diretamente no seu painel.",
    icon: "checkCircle" as const,
  },
  {
    title: "Acesso imediato",
    description: "A liberação premium acontece logo após a confirmação.",
    icon: "spark" as const,
  },
];

const comparisonRows: {
  label: string;
  values: Record<string, string | boolean>;
}[] = [
  {
    label: "Gerações profundas por dia",
    values: { monthly: "3 / dia", premium: "5 / dia", yearly: "3 / dia" },
  },
  {
    label: "Materiais completos por ciclo",
    values: {
      monthly: "~35 / mês",
      premium: "~80 / mês",
      yearly: "~450 / ano",
    },
  },
  {
    label: "Geradores com IA (planejamentos e materiais)",
    values: { monthly: true, premium: true, yearly: true },
  },
  {
    label: "Editor integrado e histórico",
    values: { monthly: true, premium: true, yearly: true },
  },
  {
    label: "Biblioteca premium e marketplace",
    values: { monthly: true, premium: true, yearly: true },
  },
  {
    label: "Acesso premium ao dashboard",
    values: { monthly: true, premium: true, yearly: true },
  },
  {
    label: "IA avançada (materiais profundos)",
    values: { monthly: true, premium: true, yearly: true },
  },
  {
    label: "Melhor custo-benefício",
    values: { monthly: false, premium: false, yearly: true },
  },
];

const planFaq = [
  {
    question: "Por que existe limite diário de gerações?",
    answer:
      "Provas, apostilas, planos de aula e materiais extensos usam a IA mais avançada do mercado para entregar profundidade pedagógica e menos erros. Cada geração exige processamento intenso — preferimos 3 materiais excelentes por dia a dezenas de rascunhos rasos. A cota reinicia à meia-noite (horário de Brasília).",
  },
  {
    question: "Como funcionam os créditos?",
    answer:
      "Materiais completos (provas, apostilas, slides) consomem mais créditos que flashcards e resumos. Você acompanha o saldo no painel; ele renova a cada ciclo do plano. O limite diário e os créditos trabalham juntos para garantir qualidade e sustentabilidade.",
  },
  {
    question: "Qual a diferença entre Pro e Premium?",
    answer:
      "O Premium oferece até 5 gerações profundas por dia (contra 3 no Pro) — materiais e planejamentos anuais/trimestrais — e cerca de 80 materiais completos por mês (contra ~35). Ideal para quem cria apostilas, provas, listas e planejamentos com alta frequência.",
  },
  {
    question: "Posso trocar de plano depois?",
    answer:
      "Sim. Você pode escolher outro plano quando quiser. O acesso premium acompanha a assinatura ativa vinculada ao seu e-mail.",
  },
  {
    question: "O pagamento é seguro?",
    answer:
      "Sim. O checkout é processado com segurança e seus dados de pagamento ficam protegidos. A liberação premium acontece logo após a confirmação.",
  },
];

const includedFeatures = [
  `${landingPublicToolCount} ferramentas com IA`,
  "Construtor de aula e planejamentos BNCC",
  "Editor, histórico e biblioteca premium",
  "Exportação Google Docs com modelos oficiais",
];

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const params = searchParams ? await searchParams : {};
  const alert = getAlert(params);

  return (
    <PublicProfessorPrimeiroLayout>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className={ppEyebrow}>Planos Planify</p>
          <h1 className={`${ppTitle} mt-4`}>
            Libere o Planify e crie materiais{" "}
            <span className={ppTitleAccent}>sem limites manuais.</span>
          </h1>
          <p className={`mt-5 max-w-2xl ${ppLead}`}>
            Materiais profundos com IA avançada — qualidade de preparação manual,
            em minutos. Créditos claros, limite diário previsível e checkout seguro.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {includedFeatures.map((item) => (
              <span key={item} className={ppBadge}>
                <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
                {item}
              </span>
            ))}
          </ul>
        </div>

        {alert && (
          <div
            className={`mt-8 flex max-w-3xl gap-3 rounded-2xl border p-5 ${alertClass(alert.type)}`}
          >
            <PlanifyIcon
              name={alert.type === "success" ? "checkCircle" : "alertCircle"}
              className="h-5 w-5 shrink-0"
            />
            <div>
              <p className="text-sm font-black">{alert.title}</p>
              <p className="mt-1 text-sm font-medium leading-6">{alert.message}</p>
            </div>
          </div>
        )}

        <div
          id="precos"
          className="mt-12 grid scroll-mt-28 items-stretch gap-6 lg:grid-cols-3"
        >
          {billingPlans.map((plan) => (
            <article
              key={plan.key}
              className={`relative flex h-full flex-col rounded-2xl border p-7 transition hover:shadow-md ${
                plan.highlighted
                  ? ppPlanHighlight
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {plan.badgeLabel && (
                <span
                  className={`absolute right-6 top-6 rounded-lg px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${
                    plan.highlighted
                      ? "bg-cyan-600 text-white"
                      : "bg-cyan-50 text-cyan-700"
                  }`}
                >
                  {plan.badgeLabel}
                </span>
              )}

              <p className="pr-24 text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
                {plan.name}
              </p>

              <div className="mt-5 flex flex-wrap items-end gap-2">
                <span className="text-4xl font-black tracking-tight text-slate-950">
                  {plan.priceLabel}
                </span>
                <span className="pb-1.5 text-sm font-semibold text-slate-500">
                  {plan.recurrenceLabel}
                </span>
              </div>

              <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-700">
                <PlanifyIcon name="spark" className="h-4 w-4" />
                {plan.creditsLabel}
              </div>

              <p className="mt-5 text-sm font-medium leading-6 text-slate-600">
                {plan.description}
              </p>

              <ul className="mt-6 grid flex-1 gap-3 text-sm font-medium leading-6 text-slate-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <PlanifyIcon
                      name="checkCircle"
                      className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <PlanCheckoutLink
                  planKey={plan.key}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition ${
                    plan.highlighted
                      ? ppBtnPrimary
                      : "border border-slate-200 bg-white text-slate-900 hover:border-cyan-300 hover:text-cyan-700"
                  }`}
                >
                  {plan.ctaLabel}
                  <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                </PlanCheckoutLink>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className={ppLink}>
            Entrar
          </Link>
          {" · "}
          <Link href="/dashboard" className={ppLink}>
            Ir ao painel
          </Link>
        </p>
      </section>

      <section className={`${ppSectionAlt} py-14 sm:py-16`}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className={`${ppTitle} text-3xl sm:text-4xl`}>
            Compare os planos{" "}
            <span className={ppTitleAccent}>lado a lado.</span>
          </h2>
          <p className="mt-3 max-w-xl text-base font-medium text-slate-600">
            Créditos, geradores, editor e biblioteca — tudo incluído em cada
            assinatura ativa.
          </p>

          <p className="planos-compare-hint">
            <PlanifyIcon name="arrowRight" className="h-3.5 w-3.5 shrink-0 text-cyan-600" />
            Deslize para comparar os três planos
          </p>

          <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="planos-compare-wrap overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Recurso
                    </th>
                    {billingPlans.map((plan) => (
                      <th
                        key={plan.key}
                        className={`px-6 py-5 text-sm font-black ${
                          plan.highlighted ? "text-cyan-700" : "text-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {plan.name}
                          {plan.highlighted ? (
                            <span className="rounded-full bg-cyan-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
                              Popular
                            </span>
                          ) : null}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        {row.label}
                      </td>
                      {billingPlans.map((plan) => {
                        const value = row.values[plan.key];
                        return (
                          <td
                            key={plan.key}
                            className="px-6 py-4 text-sm font-medium text-slate-600"
                          >
                            {typeof value === "boolean" ? (
                              value ? (
                                <PlanifyIcon
                                  name="checkCircle"
                                  className="h-5 w-5 text-cyan-600"
                                />
                              ) : (
                                <span className="text-slate-300">—</span>
                              )
                            ) : (
                              <span className="font-bold text-slate-900">
                                {value}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Garantias */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {guarantees.map((item) => (
            <div
              key={item.title}
              className="flex h-full items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
            >
              <span className={ppIconBox}>
                <PlanifyIcon name={item.icon} className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">
          Dúvidas sobre os planos
        </h2>
        <div className="mt-8">
          <LandingFaq items={planFaq} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className={ppCtaBand}>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/90">
            Próximo passo
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
            Escolha um plano e entre no painel
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-300">
            Os valores estão logo acima. Crie sua conta para assinar com checkout
            seguro ou entre com o e-mail da assinatura já ativa para usar as{" "}
            {landingPublicToolCount} ferramentas com IA.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="#precos" className={ppBtnPrimary}>
              Ver planos acima
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="/login" className={ppBtnGhost}>
              Criar conta
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-slate-300 underline-offset-4 transition hover:text-white hover:underline"
            >
              Já sou assinante — Entrar
            </Link>
          </div>
        </div>
      </section>

    </PublicProfessorPrimeiroLayout>
  );
}
