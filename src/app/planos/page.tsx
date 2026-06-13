import type { Metadata } from "next";
import Link from "next/link";
import { PublicProfessorPrimeiroLayout } from "@/components/public/PublicProfessorPrimeiroLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PlanCheckoutLink } from "@/components/planos/PlanCheckoutLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { LandingFaq } from "@/components/public/landing/LandingFaq";
import {
  ppBadge,
  ppBtnOnDark,
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
      type: "success",
      title: "Conta criada",
      message:
        "Conta pronta! Assine o plano Professor abaixo para iniciar o checkout e liberar os geradores IA.",
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

const guarantees = [
  {
    title: "Pagamento seguro",
    description: "Checkout processado com segurança e dados protegidos.",
    icon: "lock" as const,
  },
  {
    title: "Uso generoso",
    description: "Limites altos pensados para o dia a dia do professor.",
    icon: "checkCircle" as const,
  },
  {
    title: "Acesso imediato",
    description: "A liberação premium acontece logo após a confirmação.",
    icon: "spark" as const,
  },
];

const includedFeatures = [
  `${landingPublicToolCount} ferramentas com IA`,
  "Construtor de aula e planejamentos BNCC",
  "Editor, histórico e biblioteca premium",
  "Exportação Google Docs com modelos oficiais",
];

const planFaq = [
  {
    question: "O plano é realmente ilimitado?",
    answer:
      "O Planify Professor inclui uso generoso para o dia a dia docente: até 5 gerações profundas por dia (materiais e planejamentos) e créditos mensais amplos. Isso cobre a rotina da grande maioria dos professores. Para uso automatizado ou em volume extremo, aplicamos política de uso justo.",
  },
  {
    question: "Por que existe limite diário de gerações?",
    answer:
      "Provas, apostilas, planos de aula e materiais extensos usam IA avançada para entregar profundidade pedagógica. Cada geração exige processamento intenso — preferimos poucos materiais excelentes por dia a dezenas de rascunhos rasos. A cota reinicia à meia-noite (horário de Brasília).",
  },
  {
    question: "Como funcionam os créditos?",
    answer:
      "Materiais completos (provas, apostilas, slides) consomem mais créditos que flashcards e resumos. Você acompanha o saldo no painel; ele renova a cada ciclo mensal da assinatura.",
  },
  {
    question: "Já assinei Pro, Premium ou Anual — o que muda?",
    answer:
      "Nada para você agora: assinaturas antigas continuam ativas com os benefícios do plano contratado. Novas assinaturas seguem o plano único Professor por R$ 24,90/mês.",
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
  const plan = billingPlans[0];

  return (
    <PublicProfessorPrimeiroLayout>
      <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className={ppEyebrow}>Plano único Planify</p>
          <h1 className={`${ppTitle} mt-4`}>
            Tudo para o professor por{" "}
            <span className={ppTitleAccent}>R$ 24,90/mês.</span>
          </h1>
          <p className={`mx-auto mt-5 max-w-2xl ${ppLead}`}>
            Um plano simples, sem escolher tier: geradores com IA, planejamentos
            BNCC, editor, exportação e biblioteca premium — com uso generoso no
            preço de lançamento.
          </p>

          <ul className="mt-6 flex flex-wrap justify-center gap-2">
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
            className={`mx-auto mt-8 flex max-w-3xl gap-3 rounded-2xl border p-5 ${alertClass(alert.type)}`}
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

        <div id="precos" className="mx-auto mt-12 max-w-lg scroll-mt-28">
          <article
            className={`relative flex h-full flex-col rounded-2xl border p-7 transition hover:shadow-md ${ppPlanHighlight}`}
          >
            {plan.badgeLabel && (
              <span className="absolute right-6 top-6 rounded-lg bg-cyan-600 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
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

            <ul className="mt-6 grid gap-3 text-sm font-medium leading-6 text-slate-700">
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

            <div className="mt-8">
              <PlanCheckoutLink planKey={plan.key} className={`${ppBtnPrimary} flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold`}>
                {plan.ctaLabel}
                <PlanifyIcon name="arrowRight" className="h-4 w-4" />
              </PlanCheckoutLink>
              <p className="mt-3 text-center text-xs font-medium leading-5 text-slate-500">
                Após o pagamento, você cria a senha na próxima tela — use o
                mesmo e-mail do checkout.
              </p>
            </div>
          </article>
        </div>

        <p className="mt-8 text-center text-sm font-medium text-slate-500">
          Prefere criar conta antes?{" "}
          <Link href="/login?mode=signup&redirect=/planos" className={ppLink}>
            Criar conta e depois assinar
          </Link>
          {" · "}
          <Link href="/login" className={ppLink}>
            Já tenho conta
          </Link>
        </p>
      </section>

      <section className={`${ppSectionAlt} py-14 sm:py-16`}>
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <h2 className={`${ppTitle} text-center text-3xl sm:text-4xl`}>
            Tudo incluído no{" "}
            <span className={ppTitleAccent}>plano Professor.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-base font-medium text-slate-600">
            Sem comparar tiers — um preço, acesso completo às ferramentas premium
            do Planify.
          </p>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {plan.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
              >
                <PlanifyIcon
                  name="checkCircle"
                  className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600"
                />
                <span className="text-sm font-medium leading-6 text-slate-700">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

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

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <h2 className="text-center text-2xl font-black text-slate-950 sm:text-3xl">
          Dúvidas sobre o plano
        </h2>
        <div className="mt-8">
          <LandingFaq items={planFaq} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <div className={ppCtaBand}>
          <p className={ppCtaEyebrow}>Próximo passo</p>
          <h2 className={`mt-2 text-2xl sm:text-3xl ${ppCtaTitle}`}>
            Assine por R$ 24,90 e entre no painel
          </h2>
          <p className={`mx-auto mt-3 max-w-xl ${ppCtaLead}`}>
            Fluxo rápido: assine agora e crie a senha na tela seguinte. Ou crie
            conta antes e assine com o e-mail já logado.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link href="#precos" className={ppBtnPrimary}>
              Assinar agora
              <PlanifyIcon name="arrowRight" className="h-4 w-4" />
            </Link>
            <Link href="/login?mode=signup&redirect=/planos" className={ppBtnOnDark}>
              Criar conta primeiro
            </Link>
            <Link href="/login" className={`rounded-xl px-7 py-3.5 ${ppCtaLinkOnDark}`}>
              Já sou assinante — Entrar
            </Link>
          </div>
        </div>
      </section>
    </PublicProfessorPrimeiroLayout>
  );
}
