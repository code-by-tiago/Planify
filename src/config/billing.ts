export type BillingPlanSlug = "professor-pro-monthly" | "professor-pro-yearly";

export type BillingPlan = {
  slug: BillingPlanSlug;
  name: string;
  description: string;
  priceLabel: string;
  intervalLabel: string;
  documentLimitPerMonth: number;
  highlighted: boolean;
  stripePriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY" | "STRIPE_PRICE_PRO_YEARLY";
  features: string[];
};

export const billingPlans: BillingPlan[] = [
  {
    slug: "professor-pro-monthly",
    name: "Professor Pro Mensal",
    description: "Para professores que querem produtividade, organização e acesso premium mensal.",
    priceLabel: "R$ 49,90",
    intervalLabel: "/mês",
    documentLimitPerMonth: 30,
    highlighted: true,
    stripePriceEnvKey: "STRIPE_PRICE_PRO_MONTHLY",
    features: [
      "Planejamentos anuais e trimestrais",
      "Materiais didáticos profissionais",
      "Editor e histórico",
      "Biblioteca Premium",
      "Marketplace educacional",
    ],
  },
  {
    slug: "professor-pro-yearly",
    name: "Professor Pro Anual",
    description: "Melhor custo-benefício para usar o Planify durante todo o ano letivo.",
    priceLabel: "R$ 479,90",
    intervalLabel: "/ano",
    documentLimitPerMonth: 30,
    highlighted: false,
    stripePriceEnvKey: "STRIPE_PRICE_PRO_YEARLY",
    features: [
      "Tudo do Professor Pro Mensal",
      "Economia no plano anual",
      "Acesso premium contínuo",
      "Biblioteca e marketplace",
      "Histórico e documentos organizados",
    ],
  },
];

export function getBillingPlanBySlug(slug: string | null | undefined): BillingPlan | null {
  if (!slug) {
    return null;
  }

  return billingPlans.find((plan) => plan.slug === slug) ?? null;
}
