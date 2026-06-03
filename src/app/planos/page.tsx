import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { Reveal } from "@/components/public/landing/Reveal";
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

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const params = searchParams ? await searchParams : {};
  const alert = getAlert(params);

  return (
    <main className="planify-ui3 min-h-screen overflow-x-clip">
      <PublicHeader active="planos" />

      {/* Hero */}
      <section className="pl-aurora relative">
        <div className="pl-grid absolute inset-0 -z-10" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <Reveal>
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700 shadow-sm backdrop-blur">
                <PlanifyIcon name="plans" className="h-4 w-4" />
                Planos Planify
              </span>

              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
                Escolha seu plano e libere o{" "}
                <span className="pl-gradient-text">Planify Premium</span>.
              </h1>

              <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
                Acesso aos geradores com IA, planejamentos alinhados à BNCC,
                materiais didáticos, editor, histórico organizado, biblioteca
                premium e marketplace pedagógico.
              </p>
            </div>
          </Reveal>

          {alert && (
            <div className={`mt-8 flex gap-3 rounded-2xl border p-5 ${alertClass(alert.type)}`}>
              <PlanifyIcon
                name={alert.type === "success" ? "checkCircle" : "alertCircle"}
                className="h-5 w-5 shrink-0"
              />
              <div>
                <p className="text-sm font-black">{alert.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6">{alert.message}</p>
              </div>
            </div>
          )}

          <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
            {billingPlans.map((plan, index) => (
              <Reveal key={plan.key} delay={index * 0.08}>
                <article
                  className={`relative flex h-full flex-col rounded-[2rem] border p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                    plan.highlighted
                      ? "border-slate-950 bg-white ring-2 ring-slate-950 lg:scale-[1.03]"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  {plan.badgeLabel && (
                    <span
                      className={`absolute right-6 top-6 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                        plan.highlighted
                          ? "bg-slate-950 text-white"
                          : "bg-indigo-50 text-indigo-700"
                      }`}
                    >
                      {plan.badgeLabel}
                    </span>
                  )}

                  <p className="pr-24 text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
                    {plan.name}
                  </p>

                  <div className="mt-5 flex flex-wrap items-end gap-2">
                    <span className="text-4xl font-black tracking-tight text-slate-950">
                      {plan.priceLabel}
                    </span>
                    <span className="pb-1.5 text-sm font-bold text-slate-500">
                      {plan.recurrenceLabel}
                    </span>
                  </div>

                  <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-700">
                    <PlanifyIcon name="spark" className="h-4 w-4" />
                    {plan.creditsLabel}
                  </div>

                  <p className="mt-5 text-sm font-semibold leading-6 text-slate-600">
                    {plan.description}
                  </p>

                  <ul className="mt-6 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
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
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black transition hover:-translate-y-0.5 ${
                        plan.highlighted
                          ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                          : "border border-slate-200 bg-white text-slate-900 hover:border-slate-950"
                      }`}
                    >
                      {plan.ctaLabel}
                      <PlanifyIcon name="arrowRight" className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparativo */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <Reveal>
          <div className="max-w-2xl">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              Comparativo
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Compare os planos lado a lado.
            </h2>
          </div>
        </Reveal>

        <Reveal>
          <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-5 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Recurso
                    </th>
                    {billingPlans.map((plan) => (
                      <th
                        key={plan.key}
                        className={`px-6 py-5 text-sm font-black ${
                          plan.highlighted ? "text-slate-950" : "text-slate-700"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {plan.name}
                          {plan.highlighted ? (
                            <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
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
                    <tr key={row.label} className="border-b border-slate-100 last:border-0">
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        {row.label}
                      </td>
                      {billingPlans.map((plan) => {
                        const value = row.values[plan.key];
                        return (
                          <td key={plan.key} className="px-6 py-4 text-sm font-semibold text-slate-600">
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
                              <span className="font-black text-slate-900">{value}</span>
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
        </Reveal>
      </section>

      {/* Garantias */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {guarantees.map((item, index) => (
            <Reveal key={item.title} delay={index * 0.08}>
              <div className="flex h-full items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <PlanifyIcon name={item.icon} className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-black text-slate-950">{item.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Reveal>
          <div className="text-center">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
              Perguntas frequentes
            </span>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Dúvidas sobre os planos.
            </h2>
          </div>
        </Reveal>

        <div className="mt-9">
          <LandingFaq items={planFaq} />
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
