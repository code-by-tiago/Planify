import {
  isDeepGenerationType,
  nextBrazilMidnightIso,
} from "@/lib/ai/material-generation-policy";

export type DailyGenerationStatus = {
  used: number;
  limit: number;
  remaining: number;
  resetsAt: string;
  appliesToType: boolean;
};

type ConsumeResult =
  | { status: "ok"; used: number; limit: number }
  | { status: "limit_reached"; used: number; limit: number }
  | { status: "skipped" };

export async function getDailyGenerationStatus(params: {
  userId: string;
  tipo?: string;
  email?: string | null;
  planKey?: string | null;
}): Promise<DailyGenerationStatus> {
  const tipo = String(params.tipo || "");
  void params;

  return {
    used: 0,
    limit: 0,
    remaining: 0,
    resetsAt: nextBrazilMidnightIso(),
    appliesToType: isDeepGenerationType(tipo),
  };
}

export async function consumeDeepGeneration(params: {
  userId: string;
  tipo: string;
  email?: string | null;
}): Promise<ConsumeResult> {
  void params;
  return { status: "skipped" };
}

export async function refundDeepGeneration(userId: string): Promise<void> {
  void userId;
}
