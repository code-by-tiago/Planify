import type { Plan } from "../types";

export const plans: Plan[] = [
  {
    id: "professor-start",
    name: "Professor Start",
    description: "Plano inicial para organizar os primeiros materiais.",
    priceInCents: 0,
    currency: "BRL",
    interval: "free",
    documentLimitPerMonth: 0,
    features: [
      { id: "dashboard", label: "Dashboard", included: true },
      { id: "modules", label: "Módulos principais", included: true },
      { id: "basic-organization", label: "Organização inicial", included: true },
    ],
    isPopular: false,
    isActive: true,
  },
  {
    id: "professor-pro-monthly",
    name: "Professor Pro",
    description: "Plano mensal para produtividade docente.",
    priceInCents: 4990,
    currency: "BRL",
    interval: "monthly",
    documentLimitPerMonth: 30,
    features: [
      { id: "planning", label: "Planejamentos", included: true },
      { id: "materials", label: "Materiais didáticos", included: true },
      { id: "editor", label: "Editor", included: true },
      { id: "history", label: "Histórico", included: true },
    ],
    isPopular: true,
    isActive: true,
  },
  {
    id: "professor-pro-yearly",
    name: "Professor Pro Anual",
    description: "Plano anual com melhor custo-benefício.",
    priceInCents: 47990,
    currency: "BRL",
    interval: "yearly",
    documentLimitPerMonth: 30,
    features: [
      { id: "planning", label: "Planejamentos", included: true },
      { id: "materials", label: "Materiais didáticos", included: true },
      { id: "library", label: "Biblioteca Premium", included: true },
      { id: "marketplace", label: "Comunidade", included: true },
    ],
    isPopular: false,
    isActive: true,
  },
];