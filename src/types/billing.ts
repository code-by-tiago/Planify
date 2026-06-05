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
    creditsLabel: "350 créditos/mês",
    creditsPerCycle: 350,
    envPriceKeys: ["STRIPE_PRICE_PRO_MONTHLY", "STRIPE_PRICE_PRO_MENSAL"],
    ctaLabel: "Assinar Pro mensal",
    features: [
      "350 créditos mensais",
      "Gerador IA de planejamentos",
      "Gerador IA de materiais didáticos",
      "Editor e histórico de documentos",
      "Biblioteca premium e marketplace",
      "Acesso premium ao dashboard",
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
    creditsLabel: "800 créditos/mês",
    creditsPerCycle: 800,
    envPriceKeys: ["STRIPE_PRICE_PREMIUM_MONTHLY", "STRIPE_PRICE_PREMIUM_MENSAL"],
    ctaLabel: "Assinar Premium",
    badgeLabel: "Mais completo",
    highlighted: true,
    features: [
      "800 créditos mensais",
      "Mais geração de apostilas, provas e listas",
      "Gerador IA de planejamentos",
      "Gerador IA de materiais didáticos",
      "Editor e histórico de documentos",
      "Biblioteca premium e marketplace",
      "Acesso premium ao dashboard",
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
    creditsLabel: "4.500 créditos/ano",
    creditsPerCycle: 4500,
    envPriceKeys: ["STRIPE_PRICE_PRO_YEARLY", "STRIPE_PRICE_PRO_ANUAL"],
    ctaLabel: "Assinar anual",
    badgeLabel: "Melhor anual",
    features: [
      "4.500 créditos anuais",
      "Melhor custo-benefício do Planify",
      "Gerador IA de planejamentos",
      "Gerador IA de materiais didáticos",
      "Editor e histórico de documentos",
      "Biblioteca premium e marketplace",
      "Acesso premium ao dashboard",
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
