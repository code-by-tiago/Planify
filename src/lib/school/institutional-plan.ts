export type InstitutionalPlanKey = "pequena" | "media" | "grande";

export const INSTITUTIONAL_PLAN_LABELS: Record<InstitutionalPlanKey, string> = {
  pequena: "Pequena Escola",
  media: "Média Escola",
  grande: "Grande Escola",
};

/** Limites comerciais por plano institucional (null = ilimitado). */
export const INSTITUTIONAL_TEACHER_LIMITS: Record<
  InstitutionalPlanKey,
  number | null
> = {
  pequena: 15,
  media: 40,
  grande: null,
};

export function parseInstitutionalPlanKey(
  value: unknown,
): InstitutionalPlanKey | null {
  if (value === "pequena" || value === "media" || value === "grande") {
    return value;
  }
  return null;
}

export function parseInstitutionalPlanFromMetadata(
  metadata: unknown,
): InstitutionalPlanKey | null {
  if (!metadata || typeof metadata !== "object") return null;
  return parseInstitutionalPlanKey(
    (metadata as Record<string, unknown>).institutionalPlan,
  );
}

export function getTeacherLimitForPlan(
  plan: InstitutionalPlanKey | null | undefined,
): number | null {
  if (!plan) return null;
  return INSTITUTIONAL_TEACHER_LIMITS[plan] ?? null;
}
