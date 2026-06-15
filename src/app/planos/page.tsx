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
  ppCtaBand,
  ppCtaEyebrow,
  ppCtaLead,
  ppCtaLinkOnDark,
  ppCtaTitle,
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
  title: "Plano Professor — R$ 24,90/mês",
  description:
    "Plano único Planify Professor por R$ 24,90/mês: geradores com IA, planejamentos BNCC, editor integrado, biblioteca e exportação Google Docs.",
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
        "Sua conta foi identificada, mas é necessário ter o plano Professor ativo para acessar as ferramentas premium.",
    };
  }

  if (params?.cadastro === "ok") {
    return {
      type: "warning",
      title: "Assine para começar",
      message:
        "Conclua a assinatura abaixo. Na tela seguinte ao pagamento, você cria sua senha com o mesmo e-mail.",
    };
  }

  if (params?.checkout === "missing_plan") {
    return {
      type: "warning",
      title: "Assine o plano Professor",
      message: "Inicie o checkout com segurança para liberar o acesso premium.",
    };
  }

  if (params?.checkout === "cancelled") {
    return {
      type: "warning",
      title: "Checkout cancelado",
      message: "Você pode assinar quando quiser continuar.",
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

const valuePillars: {
  icon: PlanifyIconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "spark",
    title: "Geradores com IA",
    description: `${landingPublicToolCount} ferramentas para provas, slides, jogos pedagógicos, apostilas, listas, resumos e mais — com alinhamento BNCC.`,
  },
  {
    icon: "calendar",
    title: "Planejamento escolar",
    description:
      "Matrizes anuais e trimestrais, sequências didáticas e construtor de aula completa em um fluxo só.",
  },
  {
    icon: "editor",
    title: "Editor e exportação",
    description:
      "Revise no editor profissional, salve no histórico e exporte para Google Docs, PDF ou Google Classroom.",
  },
  {
    icon: "library",
    title: "Biblioteca e comunidade",
    description:
      "Modelos prontos, biblioteca premium e Comunidade Docente para trocar materiais com colegas.",
  },
];

const onboardingSteps = [
  {
    step: "1",
    title: "Assine",
    description: "Checkout seguro com Stripe. Use o e-mail que será sua conta.",
  },
  {
    step: "2",
    title: "Crie a senha",
    description: "Na confirmação do pagamento, defina sua senha de acesso.",
  },
  {
    step: "3",
    title: "Entre no painel",
    description: "Acesse todas as ferramentas premium com o mesmo e-mail.",
  },
];

const planFaq = [
  {
    question: "O uso é realmente ilimitado?",
    answer:
      "Sim. Assinantes usam todas as ferramentas com IA sem contar créditos ou cotas diárias. Para manter a qualidade do serviço, o sistema impede cliques repetidos na mesma geração e bloqueia automação em massa — uso pessoal docente, conforme nossos termos.",
  },
  {
    question: "Como faço para começar?",
    answer:
      "Clique em Assinar, conclua o checkout e crie sua senha na tela seguinte. Depois entre em /login com o mesmo e-mail do pagamento.",
  },
  {
    question: "Já assinei Pro, Premium ou Anual — preciso mudar?",
    answer:
      "Não. Assinaturas antigas continuam ativas com os benefícios contratados. Novas assinaturas seguem o plano único Professor por R$ 24,90/mês.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim. O cancelamento é feito pelo portal Stripe ou pelo suporte. Você mantém o acesso até o fim do período já pago.",
  },
];

function PricingCard({
  planKey,
  name,
  priceLabel,
  recurrenceLabel,
  usageLabel,
  features,
  ctaLabel,
  badgeLabel,
}: {
  planKey: (typeof billingPlans)[0]["key"];
  name: string;
  priceLabel: string;
  recurrenceLabel: string;
  usageLabel: string;
  features: string[];
  ctaLabel: string;
  badgeLabel?: string;
}) {
  return (
    <article
      id="precos"
      className={`relative scroll-mt-28 rounded-2xl border p-6 sm:p-7 ${ppPlanHighlight}`}
    >
      {badgeLabel ? (
        <span className="absolute right-5 top-5 rounded-lg bg-cyan-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
          {badgeLabel}
        </span>
      ) : null}

      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
        {name}
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-x-2 gap-y-1">
        <span className="text-4xl font-black tracking-tight text-slate-950 sm:text-[2.75rem]">
          {priceLabel}
        </span>
        <span className="pb-1 text-sm font-semibold text-slate-500">
          {recurrenceLabel}
        </span>
      </div>

      <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
        <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
        {usageLabel}
      </p>

      <ul className="mt-6 space-y-2.5 border-t border-slate-100 pt-6 text-sm font-medium leading-6 text-slate-700">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <PlanifyIcon
              name="checkCircle"
              className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600"
            />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <PlanCheckoutLink
          planKey={planKey}
          className={`${ppBtnPrimary} flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold`}
        >
          {ctaLabel}
          <PlanifyIcon name="arrowRight" className="h-4 w-4" />
        </PlanCheckoutLink>
      </div>

      <ul className="mt-5 space-y-2 border-t border-slate-100 pt-5 text-xs font-medium text-slate-500">
        <li className="flex items-center gap-2">
          <PlanifyIcon name="lock" className="h-3.5 w-3.5 text-slate-400" />
          Pagamento processado com segurança (Stripe)
        </li>
        <li className="flex items-center gap-2">
          <PlanifyIcon name="spark" className="h-3.5 w-3.5 text-slate-400" />
          Acesso liberado logo após a confirmação
        </li>
      </ul>
    </article>
  );
}

export default async function PlanosPage({ searchParams }: PlanosPageProps) {
  const params = searchParams ? await searchParams : {};
  const alert = getAlert(params);
  const plan = billingPlans[0];

  return (
    <PublicProfessorPrimeiroLayout>
      {/* Hero compacto */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-sky-50/40 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(8,145,178,0.08),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto max-w-2xl text-center lg:max-w-3xl">
            <p className={ppEyebrow}>Plano único · sem tiers confusos</p>
            <h1 className={`${ppTitle} mt-3 text-3xl sm:text-4xl lg:text-5xl`}>
              Um plano.{" "}
              <span className={ppTitleAccent}>Tudo incluído.</span>
            </h1>
            <p className={`mx-auto mt-4 max-w-xl ${ppLead} text-base sm:text-lg`}>
              {plan.description}
            </p>
          </div>

          {alert ? (
            <div
              className={`mx-auto mt-8 flex max-w-2xl gap-3 rounded-2xl border p-5 ${alertClass(alert.type)}`}
            >
              <PlanifyIcon
                name={alert.type === "success" ? "checkCircle" : "alertCircle"}
                className="h-5 w-5 shrink-0"
              />
              <div>
                <p className="text-sm font-black">{alert.title}</p>
                <p className="mt-1 text-sm font-medium leading-6">
                  {alert.message}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Conteúdo principal: valor + card de preço */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:gap-12 xl:gap-16">
          <div className="min-w-0">
            <h2 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              O que você leva no plano
            </h2>
            <p className="mt-2 max-w-xl text-base font-medium leading-7 text-slate-600">
              Sem comparar pacotes — um preço, acesso completo à plataforma
              premium do Planify.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {valuePillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-cyan-200/80 hover:shadow-md"
                >
                  <span className={ppIconBox}>
                    <PlanifyIcon name={pillar.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-black text-slate-950">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:sticky lg:top-8">
            <PricingCard
              planKey={plan.key}
              name={plan.name}
              priceLabel={plan.priceLabel}
              recurrenceLabel={plan.recurrenceLabel}
              usageLabel={plan.creditsLabel}
              features={plan.features}
              ctaLabel={plan.ctaLabel}
              badgeLabel={plan.badgeLabel}
            />
            <p className="mt-4 text-center text-sm font-medium text-slate-500">
              Já tem conta?{" "}
              <Link href="/login" className={ppLink}>
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Como funciona — substitui repetição do fluxo de checkout */}
      <section className={`${ppSectionAlt} py-14 sm:py-16`}>
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">
            Como começar em 3 passos
          </h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-3">
            {onboardingSteps.map((item) => (
              <li
                key={item.step}
                className="relative rounded-2xl border border-slate-200/80 bg-white p-5 text-center shadow-sm"
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-black text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 text-base font-black text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* FAQ enxuto */}
      <section className="mx-auto max-w-2xl px-5 py-14 sm:px-8 sm:py-16">
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">
          Perguntas frequentes
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm font-medium text-slate-600">
          Dúvidas comuns sobre assinatura, uso e cancelamento.
        </p>
        <div className="mt-8">
          <LandingFaq items={planFaq} />
        </div>
      </section>

      {/* CTA final — curto */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className={ppCtaBand}>
          <p className={ppCtaEyebrow}>Pronto para começar?</p>
          <h2 className={`mt-2 text-2xl sm:text-3xl ${ppCtaTitle}`}>
            Planify Professor · {plan.priceLabel}/mês
          </h2>
          <p className={`mx-auto mt-3 max-w-md ${ppCtaLead}`}>
            Assine agora e crie materiais pedagógicos com IA ainda hoje.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="#precos" className={ppBtnPrimary}>
              Ver plano e assinar
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="/login" className={`rounded-xl px-7 py-3.5 ${ppCtaLinkOnDark}`}>
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
