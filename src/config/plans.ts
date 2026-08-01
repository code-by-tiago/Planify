export const planIds = {
  start: "professor-start",
  proMonthly: "professor-pro-monthly",
  proYearly: "professor-pro-yearly",
} as const;

export type PlanId = (typeof planIds)[keyof typeof planIds];