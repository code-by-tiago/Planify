import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
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

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const params = searchParams ? await searchParams : {};
  const alert = getAlert(params);

  return (
    <main className="planify-ui3 min-h-screen">
      <PublicHeader active="planos" />

      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-700">
            <PlanifyIcon name="plans" className="h-4 w-4" />
            Planos Planify
          </span>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
            Escolha o plano ideal e libere o Planify Premium.
          </h1>

          <p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-slate-600">
            Acesso aos geradores com IA, planejamentos alinhados à BNCC, materiais
            didáticos, editor, histórico organizado, biblioteca premium e
            marketplace pedagógico.
          </p>
        </div>

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

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {billingPlans.map((plan) => (
            <article
              key={plan.key}
              className={`relative flex min-h-full flex-col rounded-[2rem] border p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                plan.highlighted
                  ? "border-slate-950 bg-white ring-2 ring-slate-950"
                  : "border-slate-200 bg-white"
              }`}
            >
              {plan.badgeLabel && (
                <span className="absolute right-6 top-6 rounded-full bg-slate-950 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white">
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
                  className={`flex w-full items-center justify-center rounded-2xl px-6 py-4 text-sm font-black transition hover:-translate-y-0.5 ${
                    plan.highlighted
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-200"
                      : "border border-slate-200 bg-white text-slate-900 hover:border-slate-950"
                  }`}
                >
                  {plan.ctaLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {guarantees.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <PlanifyIcon name={item.icon} className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
