import type { MaterialEngineType } from "./material-engine-types";

/**
 * Tipos gerados pelo Material Engine (schema JSON + retries).
 * Lista/prova/atividade: banco primeiro (tryAssembleExamFromBank).
 * Lista/prova/atividade: banco primeiro (tryAssembleExamFromBank).
 */
export const PLANIFY_ENGINE_TYPES: MaterialEngineType[] = [
  "flashcards",
  "mapa-mental",
  "prova",
  "lista",
  "apostila",
  "atividade",
  "jogo",
  "resumo",
  "plano-aula",
  "redacao",
  "sequencia",
  "projeto",
  "cruzadinha",
];

/** Tipos com renderizador visual dedicado (nunca usar html cru da IA). */
export const PLANIFY_DEDICATED_RENDER_TYPES: MaterialEngineType[] = [
  "flashcards",
  "mapa-mental",
];

export function usesPlanifyMaterialEngine(tipo: MaterialEngineType): boolean {
  return PLANIFY_ENGINE_TYPES.includes(tipo);
}

export function usesDedicatedEngineRenderer(tipo: MaterialEngineType): boolean {
  return PLANIFY_DEDICATED_RENDER_TYPES.includes(tipo);
}
