import { hasUnlimitedQuota } from "@/server/auth/courtesy-emails";
import { resolveUserBillingPlanKey } from "@/server/credits/credit-subscription-sync";

/**
 * Assinantes ativos e contas cortesia não têm teto de créditos nem cota diária.
 * Proteção contra abuso fica no inflight guard (cliques repetidos / geração paralela).
 */
export async function shouldSkipUsageQuotas(params: {
  userId: string;
  email?: string | null;
}): Promise<boolean> {
  if (hasUnlimitedQuota(params.email)) {
    return true;
  }

  const planKey = await resolveUserBillingPlanKey({
    userId: params.userId,
    email: params.email,
  });

  return Boolean(planKey);
}

export function extractIdempotencyKey(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const key = String(record.idempotencyKey || record.idempotency_key || "").trim();
  return key || null;
}
