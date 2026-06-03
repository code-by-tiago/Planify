import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingFaq } from "@/components/public/landing/LandingFaq";
import { billingPlans } from "../../types/billing";

export const dynamic = "force-dynamic";

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
        "Agora escolha um plano para liberar o acesso premium ao Planify.",
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
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
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
    label: "Créditos por ciclo",
    values: { monthly: "350 / mês", premium: "800 / mês", yearly: "4.500 / ano" },
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
    label: "Volume de apostilas, provas e listas",
    values: { monthly: "Padrão", premium: "Ampliado", yearly: "Padrão" },
  },
  {
    label: "Melhor custo-benefício",
    values: { monthly: false, premium: false, yearly: true },
  },
];

const planFaq = [
  {
    question: "Como funcionam os créditos?",
    answer:
      "Cada geração com IA consome créditos do seu ciclo. Você acompanha o saldo direto no painel e ele é renovado a cada ciclo do plano (mensal ou anual).",
  },
  {
    question: "Qual a diferença entre Pro e Premium?",
    answer:
      "O Premium oferece mais créditos por mês (800 contra 350), ideal para quem cria apostilas, provas e materiais extensos com alta frequência. Os recursos da plataforma são os mesmos.",
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
  "13 ferramentas com IA",
  "Construtor de aula e planejamentos BNCC",
  "Editor, histórico e biblioteca premium",
  "Exportação em DOCX oficial",
];

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const params = searchParams ? await searchParams : {};
  const alert = getAlert(params);

  return (
    <main className="planify-ui3 planify-public min-h-screen overflow-x-clip">
      <PublicHeader active="planos" />

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
            Planos Planify
          </p>
          <h1 className="mt-4 text-4xl font-black leading-[1.06] tracking-tight text-slate-950 sm:text-5xl">
            Libere o Planify e crie materiais{" "}
            <span className="pl-gradient-text">sem limites manuais.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-600">
            Mesma proposta das plataformas pedagógicas modernas: IA, BNCC e
            ferramentas em um só lugar — com créditos claros e checkout seguro.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {includedFeatures.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-800"
              >
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

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
          {billingPlans.map((plan) => (
            <article
              key={plan.key}
              className={`relative flex h-full flex-col rounded-3xl border p-7 transition hover:shadow-lg ${
                plan.highlighted
                      ? "border-indigo-300 bg-white shadow-md ring-2 ring-indigo-500/30 lg:scale-[1.02]"
                  : "border-slate-200 bg-white shadow-sm"
              }`}
            >
              {plan.badgeLabel && (
                <span
                  className={`absolute right-6 top-6 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                    plan.highlighted
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 text-indigo-700"
                  }`}
                >
                  {plan.badgeLabel}
                </span>
              )}

              <p className="pr-24 text-xs font-black uppercase tracking-[0.2em] text-blue-600">
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

              <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
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
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link
                  href={`/api/stripe/checkout?plan=${plan.key}`}
                  prefetch={false}
                  className={`flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold transition ${
                    plan.highlighted
                      ? "pl-btn-brand text-slate-900 hover:brightness-95"
                      : "border border-slate-200 bg-white text-slate-900 hover:border-blue-300 hover:text-blue-700"
                  }`}
                >
                  {plan.ctaLabel}
                  <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Já tem conta?{" "}
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-800">
            Entrar
          </Link>
          {" · "}
          <Link
            href="/dashboard"
            className="font-bold text-blue-600 hover:text-blue-800"
          >
            Ir ao painel
          </Link>
        </p>
      </section>

      {/* Comparativo — faixa lavanda */}
      <section className="border-y border-indigo-100/50 pl-app-bg py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Compare os planos{" "}
            <span className="pl-gradient-text">lado a lado.</span>
          </h2>
          <p className="mt-3 max-w-xl text-base font-medium text-slate-600">
            Créditos, geradores, editor e biblioteca — tudo incluído em cada
            assinatura ativa.
          </p>

          <div className="mt-8 overflow-hidden rounded-3xl border border-white/60 bg-white shadow-sm">
            <div className="overflow-x-auto">
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
                          plan.highlighted ? "text-blue-700" : "text-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {plan.name}
                          {plan.highlighted ? (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
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
                                  className="h-5 w-5 text-emerald-600"
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
              className="flex h-full items-start gap-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
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

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className="rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-700 px-8 py-10 text-center text-white sm:px-12">
          <h2 className="text-2xl font-black sm:text-3xl">
            Pronto para começar grátis?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm font-medium text-blue-100">
            Crie sua conta, escolha um plano e acesse o Construtor de aula com as
            13 ferramentas do Planify.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="pl-btn-brand inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-slate-900"
            >
              Criar conta
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-bold text-white hover:bg-white/10"
            >
              Acessar painel
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
