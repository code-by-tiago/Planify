/**
 * Plano atual ilimitado: nenhuma ferramenta consome saldo, credito mensal ou cota diaria.
 * A protecao operacional fica no inflight guard contra geracoes paralelas repetidas.
 */
export async function shouldSkipUsageQuotas(params: {
  userId: string;
  email?: string | null;
}): Promise<boolean> {
  void params;
  return true;
}

export function extractIdempotencyKey(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const key = String(record.idempotencyKey || record.idempotency_key || "").trim();
  return key || null;
}
