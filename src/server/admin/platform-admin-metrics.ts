import { normalizeBillingPlanKey } from "@/types/billing";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export type DailyCountPoint = {
  date: string;
  count: number;
};

export type StateCountPoint = {
  state: string;
  count: number;
};

export type AdminActivityFeedItem = {
  id: string;
  maskedUserId: string;
  tipo: string;
  className: string | null;
  createdAt: string;
};

export type AdminFinancialMetrics = {
  mrrEstimatedBrl: number;
  mrrFormula: string;
  mrrBreakdown: {
    subscriptionMrrBrl: number;
    schoolLicenseMrrBrl: number;
    activeSubscriptions: number;
    activeSchoolLicenses: number;
  };
  costPerRequestBrl: number;
  costFormula: string;
  generationsThisMonth: number;
  estimatedMonthlyGeminiCostBrl: number;
  avgTokensPerGeneration: number;
};

export type AdminDashboardMetrics = {
  geminiConsumption: DailyCountPoint[];
  geminiSource: string;
  userGrowth: DailyCountPoint[];
  schoolsByState: StateCountPoint[];
  financial: AdminFinancialMetrics;
  checkedAt: string;
};

const PLAN_MRR_BRL: Record<string, number> = {
  monthly: 49.9,
  premium: 89.9,
  yearly: 479.9 / 12,
};

const DEFAULT_SCHOOL_LICENSE_MRR_BRL = Number(
  process.env.PLANIFY_MRR_PER_SCHOOL_BRL || "299",
);

const USD_BRL = Number(process.env.USD_BRL_RATE || "5.5");
const GEMINI_INPUT_USD_PER_M = Number(process.env.GEMINI_INPUT_USD_PER_M || "0.15");
const GEMINI_OUTPUT_USD_PER_M = Number(process.env.GEMINI_OUTPUT_USD_PER_M || "0.60");

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  for (let index = n - 1; index >= 0; index -= 1) {
    const date = new Date(cursor);
    date.setUTCDate(cursor.getUTCDate() - index);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

function buildDailySeries(
  rows: Array<{ created_at: string }>,
  days: number,
): DailyCountPoint[] {
  const keys = lastNDays(days);
  const counts = new Map<string, number>(keys.map((key) => [key, 0]));

  for (const row of rows) {
    const key = dayKey(row.created_at);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return keys.map((date) => ({
    date,
    count: counts.get(date) || 0,
  }));
}

async function fetchGeminiConsumptionSeries(
  sinceIso: string,
): Promise<{ series: DailyCountPoint[]; source: string }> {
  const supabase = getSupabaseAdminClient();

  const { data: events, error: eventsError } = await supabase
    .from("generation_events")
    .select("created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(20_000);

  if (!eventsError && Array.isArray(events) && events.length > 0) {
    return {
      series: buildDailySeries(events as Array<{ created_at: string }>, 30),
      source: "generation_events (telemetria IA, últimos 30 dias)",
    };
  }

  const { data: materials, error: materialsError } = await supabase
    .from("generated_materials")
    .select("created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(20_000);

  if (materialsError) {
    throw new Error(materialsError.message);
  }

  return {
    series: buildDailySeries((materials || []) as Array<{ created_at: string }>, 30),
    source:
      "generated_materials.created_at (fallback — generation_events indisponível)",
  };
}

async function fetchUserGrowthSeries(sinceIso: string): Promise<DailyCountPoint[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: true })
    .limit(20_000);

  if (error) {
    throw new Error(error.message);
  }

  return buildDailySeries((data || []) as Array<{ created_at: string }>, 90);
}

async function fetchSchoolsByState(): Promise<StateCountPoint[]> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.from("schools").select("state");

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();

  for (const row of data || []) {
    const state = String((row as { state?: string | null }).state || "")
      .trim()
      .toUpperCase();
    const label = state || "N/I";
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count);
}

function maskUserId(userId: string): string {
  const normalized = String(userId || "").trim();
  if (normalized.length <= 8) {
    return `${normalized.slice(0, 4)}***`;
  }
  return `${normalized.slice(0, 8)}***`;
}

export async function fetchAdminActivityFeed(
  limit = 20,
): Promise<AdminActivityFeedItem[]> {
  const supabase = getSupabaseAdminClient();
  const safeLimit = Math.min(Math.max(limit, 1), 50);

  const { data, error } = await supabase
    .from("generated_materials")
    .select("id,user_id,tipo,class_name,created_at")
    .order("created_at", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as Array<{
    id: string;
    user_id: string;
    tipo: string;
    class_name: string | null;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    maskedUserId: maskUserId(row.user_id),
    tipo: row.tipo,
    className: row.class_name,
    createdAt: row.created_at,
  }));
}

async function fetchFinancialMetrics(): Promise<AdminFinancialMetrics> {
  const supabase = getSupabaseAdminClient();
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const monthStartIso = monthStart.toISOString();

  const [{ data: subscriptions }, { data: memberships }, genResult] =
    await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_key,status")
        .in("status", ["active", "trialing"]),
      supabase
        .from("school_memberships")
        .select("school_id")
        .eq("status", "active"),
      supabase
        .from("generated_materials")
        .select("input_tokens,output_tokens")
        .gte("created_at", monthStartIso),
    ]);

  let subscriptionMrrBrl = 0;
  let activeSubscriptions = 0;

  for (const row of subscriptions || []) {
    const planKey = normalizeBillingPlanKey(
      String((row as { plan_key?: string }).plan_key || ""),
    );
    if (!planKey) continue;
    activeSubscriptions += 1;
    subscriptionMrrBrl += PLAN_MRR_BRL[planKey] || 0;
  }

  const activeSchoolIds = new Set<string>();
  for (const row of memberships || []) {
    activeSchoolIds.add(String((row as { school_id: string }).school_id));
  }

  const activeSchoolLicenses = activeSchoolIds.size;
  const schoolLicenseMrrBrl =
    activeSchoolLicenses * DEFAULT_SCHOOL_LICENSE_MRR_BRL;

  const mrrEstimatedBrl = subscriptionMrrBrl + schoolLicenseMrrBrl;

  const generations = (genResult.data || []) as Array<{
    input_tokens: number;
    output_tokens: number;
  }>;
  const generationsThisMonth = generations.length;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (const row of generations) {
    totalInputTokens += Number(row.input_tokens) || 0;
    totalOutputTokens += Number(row.output_tokens) || 0;
  }

  const tokenCostUsd =
    (totalInputTokens / 1_000_000) * GEMINI_INPUT_USD_PER_M +
    (totalOutputTokens / 1_000_000) * GEMINI_OUTPUT_USD_PER_M;

  const estimatedMonthlyGeminiCostBrl =
    Number(process.env.GEMINI_MONTHLY_COST_ESTIMATE_BRL) ||
    tokenCostUsd * USD_BRL;

  const costPerRequestBrl =
    generationsThisMonth > 0
      ? estimatedMonthlyGeminiCostBrl / generationsThisMonth
      : 0;

  const avgTokensPerGeneration =
    generationsThisMonth > 0
      ? Math.round(
          (totalInputTokens + totalOutputTokens) / generationsThisMonth,
        )
      : 0;

  const mrrFormula =
    `Assinaturas ativas × preço mensal equivalente (${Object.entries(PLAN_MRR_BRL)
      .map(([key, value]) => `${key}=R$${value.toFixed(2)}`)
      .join(", ")}) + escolas com ≥1 membership ativo × R$${DEFAULT_SCHOOL_LICENSE_MRR_BRL.toFixed(2)}/mês (PLANIFY_MRR_PER_SCHOOL_BRL)`;

  const costFormula =
    `Custo mensal Gemini estimado (tokens input/output × tarifas USD/M ou GEMINI_MONTHLY_COST_ESTIMATE_BRL) ÷ gerações do mês em generated_materials`;

  return {
    mrrEstimatedBrl: Math.round(mrrEstimatedBrl * 100) / 100,
    mrrFormula,
    mrrBreakdown: {
      subscriptionMrrBrl: Math.round(subscriptionMrrBrl * 100) / 100,
      schoolLicenseMrrBrl: Math.round(schoolLicenseMrrBrl * 100) / 100,
      activeSubscriptions,
      activeSchoolLicenses,
    },
    costPerRequestBrl: Math.round(costPerRequestBrl * 10000) / 10000,
    costFormula,
    generationsThisMonth,
    estimatedMonthlyGeminiCostBrl:
      Math.round(estimatedMonthlyGeminiCostBrl * 100) / 100,
    avgTokensPerGeneration,
  };
}

export async function fetchAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [gemini, userGrowth, schoolsByState, financial] = await Promise.all([
    fetchGeminiConsumptionSeries(since30d),
    fetchUserGrowthSeries(since90d),
    fetchSchoolsByState(),
    fetchFinancialMetrics(),
  ]);

  return {
    geminiConsumption: gemini.series,
    geminiSource: gemini.source,
    userGrowth,
    schoolsByState,
    financial,
    checkedAt: new Date().toISOString(),
  };
}
