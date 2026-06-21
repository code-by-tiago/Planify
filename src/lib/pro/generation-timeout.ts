/** Margem segura abaixo do maxDuration (300s) das rotas na Vercel. */
export const GENERATION_CLIENT_TIMEOUT_MS = 280_000;

/** Teto de trabalho no servidor antes de entregar o melhor resultado possível. */
export const GENERATION_SERVER_DEADLINE_MS = 235_000;

/** Geração padrão (sem Elevar qualidade) — entrega rápida. */
export const GENERATION_FAST_DEADLINE_MS = 90_000;

/** Timeout por chamada Gemini no fluxo rápido. */
export const MATERIAL_GEMINI_CALL_TIMEOUT_MS = 55_000;

/** Teto total para pacote aula completa (vários materiais em sequência). */
export const BUNDLE_SERVER_DEADLINE_MS = 275_000;

export function createGenerationTimeoutError(
  surface: "material" | "planejamento" | "inclusao" | "correcao" | "aula-completa",
): Error & { code: string } {
  const hints: Record<typeof surface, string> = {
    material:
      "A geração passou do tempo limite. Tente com menos itens, desmarque gabarito comentado ou aguarde alguns instantes.",
    planejamento:
      "O planejamento passou do tempo limite. Reduza conteúdos selecionados ou tente novamente em instantes.",
    inclusao:
      "A adaptação inclusiva passou do tempo limite. Tente com um texto menor ou aguarde alguns instantes.",
    correcao:
      "A correção passou do tempo limite. Tente com respostas menores ou corrija em lotes menores.",
    "aula-completa":
      "O pacote passou do tempo limite. Mantenha só os materiais essenciais (plano, slides, atividade, lista) e tente de novo.",
  };

  const error = new Error(hints[surface]) as Error & { code: string };
  error.code = "timeout";
  return error;
}

export function isFetchTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

export function withGenerationTimeoutSignal(
  signal?: AbortSignal,
  timeoutMs = GENERATION_CLIENT_TIMEOUT_MS,
): AbortSignal {
  if (signal) return signal;
  return AbortSignal.timeout(timeoutMs);
}
