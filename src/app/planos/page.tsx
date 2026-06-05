import Link from "next/link";
import { PageShell } from "../../components/PageShell";
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
        "Verifique as variáveis do Stripe no .env.local e na Vercel e tente novamente.",
    };
  }

  return null;
}

function alertClass(type: string) {
  if (type === "success") {
    return "border-emerald-300/30 bg-emerald-300/10 text-emerald-100";
  }

  if (type === "error") {
    return "border-rose-300/30 bg-rose-300/10 text-rose-100";
  }

  return "border-amber-300/30 bg-amber-300/10 text-amber-100";
}

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const params = searchParams ? await searchParams : {};
  const alert = getAlert(params);

  return (
    <PageShell>
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="rounded-[2.5rem] border border-cyan-300/20 bg-cyan-300/10 p-8 shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
            Planos Planify
          </p>

          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl">
            Escolha o plano ideal para liberar o Planify Premium.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-cyan-100/85">
            Acesso aos geradores com IA, planejamentos com BNCC, materiais
            didáticos, editor, histórico organizado, biblioteca premium e
            marketplace.
          </p>

          {alert && (
            <div className={`mt-8 rounded-2xl border p-5 ${alertClass(alert.type)}`}>
              <p className="text-sm font-black uppercase tracking-[0.2em]">
                {alert.title}
              </p>
              <p className="mt-2 text-sm leading-7">{alert.message}</p>
            </div>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {billingPlans.map((plan) => (
            <article
              key={plan.key}
              className={`relative flex min-h-full flex-col rounded-[2.5rem] border p-7 shadow-2xl backdrop-blur-2xl ${
                plan.highlighted
                  ? "border-cyan-300/50 bg-cyan-300/10 shadow-cyan-500/10"
                  : "border-white/10 bg-white/[0.06]"
              }`}
            >
              {plan.badgeLabel && (
                <span className="absolute right-5 top-5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-100">
                  {plan.badgeLabel}
                </span>
              )}

              <p className="pr-28 text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                {plan.name}
              </p>

              <div className="mt-6 flex flex-wrap items-end gap-3">
                <span className="text-4xl font-black text-white xl:text-5xl">
                  {plan.priceLabel}
                </span>
                <span className="pb-2 text-sm font-bold text-slate-400">
                  {plan.recurrenceLabel}
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100">
                {plan.creditsLabel}
              </div>

              <p className="mt-5 text-sm leading-7 text-slate-400">
                {plan.description}
              </p>

              <ul className="mt-8 grid gap-3 text-sm leading-6 text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link
                  href={`/api/stripe/checkout?plan=${plan.key}`}
                  prefetch={false}
                  className={`flex rounded-2xl px-6 py-4 text-center text-sm font-black transition hover:-translate-y-1 ${
                    plan.highlighted
                      ? "bg-white text-slate-950 hover:bg-cyan-100"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  <span className="w-full">{plan.ctaLabel}</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
            Segurança
          </p>
          <h2 className="mt-3 text-3xl font-black text-white">
            Checkout seguro e créditos controlados pelo Planify.
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Os botões criam sessões de assinatura no servidor. A Stripe processa
            o pagamento, enquanto o Planify controla plano ativo, créditos,
            histórico e acesso premium no banco de dados.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
