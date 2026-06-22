import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/** Custo em créditos por tipo — espelha credit-service (uso no cliente). */
export const CLIENT_CREDIT_COSTS: Partial<Record<PlanifyToolId | string, number>> = {
  prova: 10,
  apostila: 10,
  slides: 10,
  "plano-aula": 10,
  redacao: 10,
  lista: 6,
  sequencia: 6,
  projeto: 6,
  atividade: 3,
  resumo: 1,
  flashcards: 1,
  "mapa-mental": 1,
  jogo: 1,
  cruzadinha: 1,
  inclusao: 6,
  "aula-completa": 28,
  "correcao-ia": 3,
};

export function getClientCreditCost(tipo: string): number {
  return CLIENT_CREDIT_COSTS[tipo] ?? 1;
}
