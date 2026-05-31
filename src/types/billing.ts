export type BillingPlanKey = "monthly" | "yearly";

export type BillingPlan = {
  key: BillingPlanKey;
  name: string;
  description: string;
  priceLabel: string;
  recurrenceLabel: string;
  envPriceKeys: string[];
  highlighted?: boolean;
};

export const billingPlans: BillingPlan[] = [
  {
    key: "monthly",
    name: "Professor Pro Mensal",
    description: "Ideal para começar com acesso premium ao Planify.",
    priceLabel: "R$ 49,90",
    recurrenceLabel: "por mês",
    envPriceKeys: ["STRIPE_PRICE_PRO_MENSAL", "STRIPE_PRICE_PRO_MONTHLY"],
  },
  {
    key: "yearly",
    name: "Professor Pro Anual",
    description: "Melhor custo-benefício para usar o Planify durante todo o ano letivo.",
    priceLabel: "R$ 479,90",
    recurrenceLabel: "por ano",
    envPriceKeys: ["STRIPE_PRICE_PRO_ANUAL", "STRIPE_PRICE_PRO_YEARLY"],
    highlighted: true,
  },
];

export function getBillingPlan(key: string | null | undefined): BillingPlan | null {
  if (!key) {
    return null;
  }

  return billingPlans.find((plan) => plan.key === key) || null;
}
