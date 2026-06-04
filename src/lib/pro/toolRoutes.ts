import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/** Rota canônica para abrir uma ferramenta no painel logado */
export function dashboardToolHref(toolId: PlanifyToolId | string) {
  return `/dashboard?tipo=${toolId}`;
}

/** Landing pública — abre a ferramenta no painel direito sem sair da home */
export function homeToolHref(toolId: PlanifyToolId | string) {
  return `/?tipo=${toolId}`;
}

export function dashboardWithTopicHref(toolId: PlanifyToolId | string, tema: string) {
  const params = new URLSearchParams({ tipo: toolId, tema: tema.trim() });
  return `/dashboard?${params.toString()}`;
}
