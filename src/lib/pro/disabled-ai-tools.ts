/**
 * Ferramentas desativadas por alto custo de IA.
 * Permanecem no catálogo interno para histórico/editor; não aparecem na UI nem aceitam novas gerações.
 */
export const DISABLED_AI_TOOLS = [
  "aula-completa",
  "slides",
  "resumo",
  "flashcards",
  "apostila",
  "mapa-mental",
  "projeto",
  "jogo",
  "sequencia",
] as const;

export type DisabledAiToolId = (typeof DISABLED_AI_TOOLS)[number];

const disabledSet = new Set<string>(DISABLED_AI_TOOLS);

export function isAiToolDisabled(toolId: string | null | undefined): boolean {
  return Boolean(toolId && disabledSet.has(toolId));
}

export function isActivePlanifyToolId(toolId: string | null | undefined): boolean {
  return Boolean(toolId && !disabledSet.has(toolId));
}

export const DISABLED_AI_TOOL_MESSAGE =
  "Esta ferramenta não está mais disponível para novas gerações. Escolha outra ferramenta no painel.";
