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

/** Plano único exibido na vitrine (/planos). */
export const billingPlans: BillingPlan[] = [
  {
    key: "monthly",
    stripePlanKey: "professor_pro",
    name: "Planify Professor",
    description:
      "Um único plano com tudo que você precisa: geradores com IA, planejamentos BNCC, editor, exportação e biblioteca premium.",
    priceLabel: "R$ 24,90",
    recurrenceLabel: "por mês",
    creditsLabel: "Uso ilimitado no plano",
    creditsPerCycle: 800,
    envPriceKeys: [
      "STRIPE_PRICE_PRO_MONTHLY",
      "STRIPE_PRICE_PRO_MENSAL",
      "STRIPE_PRICE_FOUNDING_MONTHLY",
    ],
    ctaLabel: "Assinar agora",
    badgeLabel: "Preço de lançamento",
    highlighted: true,
    features: [
      "Uso ilimitado de todas as ferramentas com IA",
      "Todas as ferramentas e planejamentos BNCC",
      "Editor, histórico e exportação Google Docs/PDF",
      "Biblioteca premium e Comunidade",
      "Política de uso justo contra automação abusiva",
    ],
  },
];

/** Planos legados — assinantes ativos e price IDs antigos no Stripe. */
const legacyBillingPlans: BillingPlan[] = [
  {
    key: "premium",
    stripePlanKey: "professor_premium",
    name: "Professor Premium",
    description: "Plano legado para assinantes Premium.",
    priceLabel: "R$ 89,90",
    recurrenceLabel: "por mês",
    creditsLabel: "~80 materiais completos/mês",
    creditsPerCycle: 800,
    envPriceKeys: ["STRIPE_PRICE_PREMIUM_MONTHLY", "STRIPE_PRICE_PREMIUM_MENSAL"],
    ctaLabel: "Assinar Premium",
    features: [],
  },
  {
    key: "yearly",
    stripePlanKey: "professor_pro_anual",
    name: "Professor Pro Anual",
    description: "Plano legado anual.",
    priceLabel: "R$ 479,90",
    recurrenceLabel: "por ano",
    creditsLabel: "~450 materiais completos/ano",
    creditsPerCycle: 4500,
    envPriceKeys: ["STRIPE_PRICE_PRO_YEARLY", "STRIPE_PRICE_PRO_ANUAL"],
    ctaLabel: "Assinar anual",
    features: [],
  },
];

const allBillingPlans: BillingPlan[] = [...billingPlans, ...legacyBillingPlans];

export function isPublicBillingPlanKey(
  key: string | null | undefined,
): key is BillingPlanKey {
  const normalized = normalizeBillingPlanKey(key);
  return Boolean(normalized && billingPlans.some((plan) => plan.key === normalized));
}

export function getBillingPlan(key: string | null | undefined): BillingPlan | null {
  const normalizedKey = normalizeBillingPlanKey(key);

  if (!normalizedKey) {
    return null;
  }

  return allBillingPlans.find((plan) => plan.key === normalizedKey) || null;
}

/** Mapeia price_id do Stripe (env) para a chave interna do plano. */
export function resolvePlanKeyFromPriceId(
  priceId: string | null | undefined,
): BillingPlanKey | null {
  if (!priceId) {
    return null;
  }

  for (const plan of allBillingPlans) {
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
    normalized === "pro_mensal" ||
    normalized === "founding" ||
    normalized === "professor"
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
