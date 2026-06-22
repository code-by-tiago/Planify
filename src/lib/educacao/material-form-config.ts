import type { PlanifyToolId } from "@/lib/pro/planifyTools";

/** Ferramentas em que o checkbox de gabarito faz sentido pedagógico. */
export const TOOL_IDS_WITH_GABARITO: PlanifyToolId[] = [
  "prova",
  "lista",
  "atividade",
  "redacao",
  "cruzadinha",
];

export function toolSupportsGabarito(
  toolId: PlanifyToolId,
  options?: { incluirQuestoes?: boolean },
): boolean {
  if (toolId === "slides") {
    return options?.incluirQuestoes === true;
  }
  return TOOL_IDS_WITH_GABARITO.includes(toolId);
}
