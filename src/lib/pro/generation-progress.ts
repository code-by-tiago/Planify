import type { LumiCoachContext } from "./lumiMotivationalMessages";
import type { PlanifyToolId } from "./planifyTools";

const TOOL_DURATION_MS: Partial<Record<PlanifyToolId | string, number>> = {
  slides: 95_000,
  prova: 80_000,
  lista: 75_000,
  apostila: 70_000,
  atividade: 65_000,
  "plano-aula": 70_000,
  sequencia: 75_000,
  jogo: 70_000,
  projeto: 80_000,
  resumo: 55_000,
  flashcards: 60_000,
  redacao: 65_000,
  "mapa-mental": 60_000,
  inclusao: 70_000,
};

const CONTEXT_DURATION_MS: Record<LumiCoachContext, number> = {
  generic: 60_000,
  material: 70_000,
  planejamento: 110_000,
  bncc: 35_000,
  docx: 25_000,
};

export function getGenerationDurationEstimateMs(params: {
  context?: LumiCoachContext;
  toolId?: PlanifyToolId | string;
  overrideMs?: number;
}): number {
  if (params.overrideMs && params.overrideMs > 0) {
    return params.overrideMs;
  }

  if (params.toolId && TOOL_DURATION_MS[params.toolId]) {
    return TOOL_DURATION_MS[params.toolId]!;
  }

  return CONTEXT_DURATION_MS[params.context || "material"];
}

export function formatRemainingTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));

  if (totalSeconds <= 5) {
    return "Quase pronto…";
  }

  if (totalSeconds < 60) {
    return `Faltam cerca de ${totalSeconds} segundos`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) {
    return minutes === 1
      ? "Falta cerca de 1 minuto"
      : `Faltam cerca de ${minutes} minutos`;
  }

  return minutes === 1
    ? `Falta cerca de 1 min e ${seconds} s`
    : `Faltam cerca de ${minutes} min e ${seconds} s`;
}

export function computeGenerationProgressPercent(
  elapsedMs: number,
  estimatedMs: number,
): number {
  if (estimatedMs <= 0) {
    return 8;
  }

  const ratio = elapsedMs / estimatedMs;
  const eased = 1 - Math.exp(-ratio * 2.4);
  return Math.min(92, Math.max(6, Math.round(eased * 100)));
}
