export const PLANEJAMENTO_PREFILL_KEY = "planify-planejamento-prefill";

export type PlanejamentoPrefill = {
  tipo?: "anual" | "trimestral";
  conteudos?: string;
};

export function writePlanejamentoPrefill(data: PlanejamentoPrefill): void {
  try {
    sessionStorage.setItem(PLANEJAMENTO_PREFILL_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function readPlanejamentoPrefill(): PlanejamentoPrefill | null {
  try {
    const raw = sessionStorage.getItem(PLANEJAMENTO_PREFILL_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PLANEJAMENTO_PREFILL_KEY);
    return JSON.parse(raw) as PlanejamentoPrefill;
  } catch {
    return null;
  }
}
