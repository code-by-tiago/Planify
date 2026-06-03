import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/** Rota canônica para abrir uma ferramenta no painel */
export function dashboardToolHref(toolId: PlanifyToolId | string) {
  return `/dashboard?tipo=${toolId}`;
}

export function dashboardWithTopicHref(toolId: PlanifyToolId | string, tema: string) {
  const params = new URLSearchParams({ tipo: toolId, tema: tema.trim() });
  return `/dashboard?${params.toString()}`;
}
