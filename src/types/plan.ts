export type PlanInterval = "free" | "monthly" | "yearly";

export type PlanFeature = {
  id: string;
  label: string;
  included: boolean;
};

export type Plan = {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  currency: "BRL";
  interval: PlanInterval;
  stripePriceId?: string;
  documentLimitPerMonth?: number;
  features: PlanFeature[];
  isPopular: boolean;
  isActive: boolean;
};