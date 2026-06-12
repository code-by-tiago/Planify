export type BillingPlanSlug = "professor-monthly";

export type BillingPlan = {
  slug: BillingPlanSlug;
  name: string;
  description: string;
  priceLabel: string;
  intervalLabel: string;
  documentLimitPerMonth: number;
  highlighted: boolean;
  stripePriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY" | "STRIPE_PRICE_FOUNDING_MONTHLY";
  features: string[];
};

export const billingPlans: BillingPlan[] = [
  {
    slug: "professor-monthly",
    name: "Planify Professor",
    description:
      "Plano único com geradores IA, planejamentos BNCC, editor, biblioteca e exportação.",
    priceLabel: "R$ 24,90",
    intervalLabel: "/mês",
    documentLimitPerMonth: 80,
    highlighted: true,
    stripePriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
    features: [
      "Planejamentos anuais e trimestrais",
      "Materiais didáticos profissionais",
      "Editor e histórico",
      "Biblioteca Premium",
      "Comunidade docente",
    ],
  },
];

export function getBillingPlanBySlug(slug: string | null | undefined): BillingPlan | null {
  if (!slug) {
    return null;
  }

  return billingPlans.find((plan) => plan.slug === slug) ?? null;
}
