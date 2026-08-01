import type { LumiCoachContext } from "./lumiMotivationalMessages";
import type { PlanifyToolId } from "./planifyTools";

const TOOL_DURATION_MS: Partial<Record<PlanifyToolId | string, number>> = {
  slides: 150_000,
  prova: 180_000,
  lista: 180_000,
  apostila: 150_000,
  atividade: 90_000,
  "plano-aula": 120_000,
  sequencia: 150_000,
  jogo: 90_000,
  projeto: 120_000,
  resumo: 75_000,
  flashcards: 60_000,
  redacao: 100_000,
  "mapa-mental": 60_000,
  inclusao: 90_000,
  pei: 150_000,
  "aula-completa": 360_000,
  cruzadinha: 90_000,
  "correcao-ia": 60_000,
};

const CONTEXT_DURATION_MS: Record<LumiCoachContext, number> = {
  generic: 60_000,
  material: 90_000,
  planejamento: 150_000,
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
  const base = Math.min(92, Math.max(6, Math.round(eased * 100)));

  if (elapsedMs <= estimatedMs * 1.05) {
    return base;
  }

  const overtimeMs = elapsedMs - estimatedMs * 1.05;
  const creep = Math.min(6, Math.floor(overtimeMs / 20_000));
  return Math.min(98, 92 + creep);
}

export function isGenerationOvertime(
  elapsedMs: number,
  estimatedMs: number,
): boolean {
  return estimatedMs > 0 && elapsedMs > estimatedMs * 1.05;
}
