import type { AIModelTier } from "./aiConfig";
import type { BillingPlanKey } from "@/types/billing";
import type { MaterialEngineType } from "@/server/materials/material-engine-types";

/** Materiais que usam geração profunda (Gemini Pro) e contam na cota diária. */
export const DEEP_GENERATION_TYPES: MaterialEngineType[] = [
  "prova",
  "apostila",
  "slides",
  "plano-aula",
  "redacao",
  "sequencia",
  "projeto",
  "lista",
];

/** Planejamento anual/trimestral — geração profunda (Pro), conta na cota diária. */
export const PLANNING_DEEP_GENERATION_TYPE = "planejamento";

/** Adaptação curricular inclusiva — geração profunda (Pro), conta na cota diária. */
export const INCLUSAO_DEEP_GENERATION_TYPE = "inclusao";

/** Pacote Aula Completa — uma cota profunda para o pacote inteiro. */
export const LESSON_BUNDLE_DEEP_GENERATION_TYPE = "aula-completa";

const DEEP_PLANNING_TYPES = new Set([
  PLANNING_DEEP_GENERATION_TYPE,
  "planejamento-anual",
  "planejamento-trimestral",
  INCLUSAO_DEEP_GENERATION_TYPE,
  LESSON_BUNDLE_DEEP_GENERATION_TYPE,
]);

/** Materiais leves — legado de cota/UI; geração inicial usa Pro como os demais. */
export const LIGHT_GENERATION_TYPES: MaterialEngineType[] = [
  "flashcards",
  "resumo",
  "mapa-mental",
  "jogo",
  "atividade",
];

export const MAX_EXPORT_FILE_BYTES = 15 * 1024 * 1024;

const DEEP_SET = new Set<string>(DEEP_GENERATION_TYPES);
const LIGHT_SET = new Set<string>(LIGHT_GENERATION_TYPES);

export function normalizeMaterialTypeKey(tipo: string): string {
  return String(tipo || "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

export function isDeepGenerationType(tipo: string): boolean {
  const key = normalizeMaterialTypeKey(tipo);
  if (DEEP_SET.has(key)) return true;
  if (LIGHT_SET.has(key)) return true;
  if (DEEP_PLANNING_TYPES.has(key)) return true;
  return false;
}

/** Tier do tipo — materiais profundos/leves usam Pro; complementares leves usam Flash. */
export function getModelTierForMaterialType(tipo: string): AIModelTier {
  const key = normalizeMaterialTypeKey(tipo);
  if (DEEP_SET.has(key) || LIGHT_SET.has(key)) return "advanced";
  if (DEEP_PLANNING_TYPES.has(key)) return "advanced";
  return "default";
}

/** Marcador de ajuste complementar no editor (SlideAiAdjustPanel). */
export const EDITOR_COMPLEMENTARY_ADJUST_MARKER =
  "AJUSTE SOLICITADO PELO PROFESSOR";

/** Marcador de regeneração focada (elevar qualidade no editor). */
export const EDITOR_ELEVATE_QUALITY_MARKER = "MODO ELEVAR QUALIDADE";

type ComplementaryGenerationContext = {
  elevarQualidade?: boolean;
  problemasQualidade?: string[] | null;
  observacoes?: string | null;
};

/** Elevar qualidade ou regeneração focada — sempre Pro. */
export function isElevateQualityGeneration(
  context: ComplementaryGenerationContext,
): boolean {
  if (context.elevarQualidade === true) return true;
  if (
    Array.isArray(context.problemasQualidade) &&
    context.problemasQualidade.length > 0
  ) {
    return true;
  }
  return String(context.observacoes ?? "").includes(
    EDITOR_ELEVATE_QUALITY_MARKER,
  );
}

/** Geração complementar no editor — ajuste, elevar qualidade ou pequena regeneração. */
export function isComplementaryMaterialGeneration(
  context: ComplementaryGenerationContext,
): boolean {
  if (isElevateQualityGeneration(context)) return true;

  const observacoes = String(context.observacoes ?? "");
  if (observacoes.includes(EDITOR_COMPLEMENTARY_ADJUST_MARKER)) return true;

  return false;
}

/** Tier efetivo para uma requisição de material (geração inicial vs complementar). */
export function getModelTierForMaterialRequest(
  tipo: string,
  context?: ComplementaryGenerationContext,
): AIModelTier {
  if (context) {
    if (isElevateQualityGeneration(context)) return "advanced";
    if (isComplementaryMaterialGeneration(context)) return "default";
  }
  return getModelTierForMaterialType(tipo);
}

/** Planejamento — Pro na geração inicial e ao elevar; Flash só em ajuste complementar leve. */
export function getModelTierForPlanning(
  context?: ComplementaryGenerationContext,
): AIModelTier {
  if (context) {
    if (isElevateQualityGeneration(context)) return "advanced";
    if (isComplementaryMaterialGeneration(context)) return "default";
  }
  return "advanced";
}

export function getDailyDeepGenerationLimit(
  planKey: string | null | undefined,
): number {
  const key = String(planKey || "").trim().toLowerCase();
  if (
    key === "monthly" ||
    key === "mensal" ||
    key === "professor_pro" ||
    key === "pro" ||
    key === "premium" ||
    key === "professor_premium"
  ) {
    return 5;
  }
  return 3;
}

export function resolveDailyLimitPlanKey(
  planKey: string | null | undefined,
): BillingPlanKey | "default" {
  if (planKey === "premium" || planKey === "professor_premium") return "premium";
  if (planKey === "yearly" || planKey === "anual" || planKey === "professor_pro_anual") {
    return "yearly";
  }
  if (
    planKey === "monthly" ||
    planKey === "mensal" ||
    planKey === "professor_pro" ||
    planKey === "pro"
  ) {
    return "monthly";
  }
  return "default";
}

/** Próxima meia-noite em America/Sao_Paulo (ISO UTC). */
export function nextBrazilMidnightIso(now = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  const utcGuess = Date.UTC(year, month - 1, day + 1, 3, 0, 0);
  return new Date(utcGuess).toISOString();
}
