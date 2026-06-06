export type BillingPlanKey = "monthly" | "premium" | "yearly";

export type BillingPlan = {
  key: BillingPlanKey;
  stripePlanKey: "professor_pro" | "professor_premium" | "professor_pro_anual";
  name: string;
  description: string;
  priceLabel: string;
  recurrenceLabel: string;
  creditsLabel: string;
  creditsPerCycle: number;
  envPriceKeys: string[];
  ctaLabel: string;
  badgeLabel?: string;
  highlighted?: boolean;
  features: string[];
};

export const billingPlans: BillingPlan[] = [
  {
    key: "monthly",
    stripePlanKey: "professor_pro",
    name: "Professor Pro Mensal",
    description:
      "Ideal para professores que querem criar planejamentos, atividades e materiais com IA durante o mês.",
    priceLabel: "R$ 49,90",
    recurrenceLabel: "por mês",
    creditsLabel: "~35 materiais completos/mês",
    creditsPerCycle: 350,
    envPriceKeys: ["STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_PRO_MENSAL"],
    ctaLabel: "Assinar Pro mensal",
    features: [
      "Até 3 gerações profundas por dia (materiais + planejamentos)",
      "~35 materiais completos por mês (provas, apostilas, planos)",
      "Gerador IA de planejamentos",
      "Editor, histórico e exportação DOCX/PDF",
      "Biblioteca premium e marketplace",
    ],
  },
  {
    key: "premium",
    stripePlanKey: "professor_premium",
    name: "Professor Premium",
    description:
      "Plano mais completo para professores com alta demanda de criação, apostilas, provas e materiais extensos.",
    priceLabel: "R$ 89,90",
    recurrenceLabel: "por mês",
    creditsLabel: "~80 materiais completos/mês",
    creditsPerCycle: 800,
    envPriceKeys: ["STRIPE_PRICE_PREMIUM_MONTHLY", "STRIPE_PRICE_PREMIUM_MENSAL"],
    ctaLabel: "Assinar Premium",
    badgeLabel: "Mais completo",
    highlighted: true,
    features: [
      "Até 5 gerações profundas por dia (materiais + planejamentos)",
      "~80 materiais completos por mês",
      "Ideal para apostilas, provas e listas em volume",
      "Gerador IA de planejamentos",
      "Editor, histórico e exportação DOCX/PDF",
      "Biblioteca premium e marketplace",
    ],
  },
  {
    key: "yearly",
    stripePlanKey: "professor_pro_anual",
    name: "Professor Pro Anual",
    description:
      "Melhor custo-benefício para usar o Planify durante todo o ano letivo com créditos anuais.",
    priceLabel: "R$ 479,90",
    recurrenceLabel: "por ano",
    creditsLabel: "~450 materiais completos/ano",
    creditsPerCycle: 4500,
    envPriceKeys: ["STRIPE_PRICE_PRO_YEARLY", "STRIPE_PRICE_PRO_ANUAL"],
    ctaLabel: "Assinar anual",
    badgeLabel: "Melhor anual",
    features: [
      "Até 3 gerações profundas por dia (materiais + planejamentos)",
      "~450 materiais completos no ano letivo",
      "Melhor custo-benefício do Planify",
      "Gerador IA de planejamentos",
      "Editor, histórico e exportação DOCX/PDF",
      "Biblioteca premium e marketplace",
    ],
  },
];

export function getBillingPlan(key: string | null | undefined): BillingPlan | null {
  const normalizedKey = normalizeBillingPlanKey(key);

  if (!normalizedKey) {
    return null;
  }

  return billingPlans.find((plan) => plan.key === normalizedKey) || null;
}

/** Mapeia price_id do Stripe (env) para a chave interna do plano. */
export function resolvePlanKeyFromPriceId(
  priceId: string | null | undefined,
): BillingPlanKey | null {
  if (!priceId) {
    return null;
  }

  for (const plan of billingPlans) {
    for (const envKey of plan.envPriceKeys) {
      const configured = process.env[envKey];
      if (configured && configured === priceId) {
        return plan.key;
      }
    }
  }

  return null;
}

export function normalizeBillingPlanKey(
  key: string | null | undefined,
): BillingPlanKey | null {
  if (!key) {
    return null;
  }

  const normalized = key.trim().toLowerCase();

  if (
    normalized === "monthly" ||
    normalized === "mensal" ||
    normalized === "professor_pro" ||
    normalized === "pro" ||
    normalized === "pro_mensal"
  ) {
    return "monthly";
  }

  if (
    normalized === "premium" ||
    normalized === "professor_premium" ||
    normalized === "premium_mensal"
  ) {
    return "premium";
  }

  if (
    normalized === "yearly" ||
    normalized === "anual" ||
    normalized === "annual" ||
    normalized === "professor_pro_anual" ||
    normalized === "pro_anual"
  ) {
    return "yearly";
  }

  return null;
}
