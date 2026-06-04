import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/** Rota canônica para abrir uma ferramenta no painel logado */
export function dashboardToolHref(toolId: PlanifyToolId | string) {
  return `/dashboard?tipo=${toolId}`;
}

/** @deprecated Use dashboardToolHref — a raiz redireciona para /dashboard */
export function homeToolHref(toolId: PlanifyToolId | string) {
  return dashboardToolHref(toolId);
}

export function dashboardWithTopicHref(toolId: PlanifyToolId | string, tema: string) {
  const params = new URLSearchParams({ tipo: toolId, tema: tema.trim() });
  return `/dashboard?${params.toString()}`;
}
