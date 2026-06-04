import type { MaterialEngineType } from "./material-engine-types";

/** Tipos com schema e render visual dedicados no Material Engine. */
export const PLANIFY_ENGINE_TYPES: MaterialEngineType[] = [
  "slides",
  "flashcards",
  "mapa-mental",
];

export function usesPlanifyMaterialEngine(tipo: MaterialEngineType): boolean {
  return PLANIFY_ENGINE_TYPES.includes(tipo);
}
