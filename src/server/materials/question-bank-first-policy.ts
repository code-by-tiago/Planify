import type { MaterialEngineInput, MaterialEngineType } from "./material-engine-types";
import type { MaterialEngineRequest } from "./material-engine-types";

/** Montagem completa do banco (entrega rápida, IA só para lacunas/genéricas). */
export const FULL_BANK_ASSEMBLY_TYPES = new Set<MaterialEngineType>([
  "lista",
  "prova",
  "atividade",
]);

/** IA gera o material, mas recebe questões fortes do banco no contexto. */
export const PARTIAL_BANK_PREFETCH_TYPES = new Set<MaterialEngineType>([
  "slides",
  "apostila",
]);

export type QuestionBankFirstMode = "full" | "prefetch" | "none";

export function resolveQuestionBankFirstMode(
  request: Pick<
    MaterialEngineRequest,
    "tipoMaterial" | "incluirQuestoes" | "elevarQualidade"
  >,
): QuestionBankFirstMode {
  if (request.elevarQualidade) return "none";

  if (FULL_BANK_ASSEMBLY_TYPES.has(request.tipoMaterial)) {
    return "full";
  }

  if (
    request.tipoMaterial === "slides" &&
    request.incluirQuestoes
  ) {
    return "prefetch";
  }

  if (PARTIAL_BANK_PREFETCH_TYPES.has(request.tipoMaterial)) {
    return "prefetch";
  }

  return "none";
}

export function resolveBankTargetQuantity(
  request: Pick<
    MaterialEngineRequest,
    "tipoMaterial" | "quantidade" | "incluirQuestoes" | "quantidadeQuestoes"
  >,
): number {
  if (request.tipoMaterial === "slides" && request.incluirQuestoes) {
    return Math.min(20, Math.max(1, request.quantidadeQuestoes ?? 3));
  }
  return request.quantidade;
}

export function materialTypeUsesExamOutput(tipo: MaterialEngineType): boolean {
  return (
    FULL_BANK_ASSEMBLY_TYPES.has(tipo) ||
    (tipo === "slides") ||
    tipo === "apostila"
  );
}

export function shouldRepairExamAfterEngine(
  request: Pick<MaterialEngineRequest, "tipoMaterial" | "incluirQuestoes">,
): boolean {
  if (FULL_BANK_ASSEMBLY_TYPES.has(request.tipoMaterial)) return true;
  if (request.tipoMaterial === "slides" && request.incluirQuestoes) return true;
  return false;
}

export function buildBankFirstEngineHint(mode: QuestionBankFirstMode): string {
  if (mode === "full") {
    return "Priorize questões do banco Planify; IA só para lacunas ou itens genéricos.";
  }
  if (mode === "prefetch") {
    return "Reutilize as questões do banco fornecidas; IA completa o restante com robustez.";
  }
  return "";
}
