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

/** Materiais leves (Flash) — não consomem cota diária profunda. */
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
  if (LIGHT_SET.has(key)) return false;
  if (DEEP_SET.has(key)) return true;
  return false;
}

export function getModelTierForMaterialType(tipo: string): AIModelTier {
  return isDeepGenerationType(tipo) ? "advanced" : "default";
}

/** Planejamento anual/trimestral — produto principal do Planify, sempre Pro. */
export function getModelTierForPlanning(): AIModelTier {
  return "advanced";
}

export function getDailyDeepGenerationLimit(
  planKey: string | null | undefined,
): number {
  const key = String(planKey || "").trim().toLowerCase();
  if (key === "premium" || key === "professor_premium") return 5;
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
