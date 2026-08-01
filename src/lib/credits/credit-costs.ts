import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/** Plano atual: ferramentas ativas nao exibem nem consomem creditos. */
export const CLIENT_CREDIT_COSTS: Partial<Record<PlanifyToolId | string, number>> = {};

export function getClientCreditCost(tipo: string): number {
  void tipo;
  return 0;
}
