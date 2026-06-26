import type { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export const PLANNING_TRIAL_FP_COOKIE = "planify_planning_trial_fp";
export const PLANNING_TRIAL_USED_COOKIE = "planify_planning_trial_used";
const FP_MAX_AGE = 60 * 60 * 24 * 365;
const USED_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;
const DEV_IP_FALLBACK = "dev-local";

export type PlanningTrialRateLimitState = {
  limited: boolean;
  fingerprint: string;
};

type DbResult = { data: unknown; error: unknown };
type SupabaseLoose = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<DbResult>;
};

const memoryUsage = new Map<string, number>();

function db(): SupabaseLoose | null {
  try {
    return getSupabaseAdminClient() as unknown as SupabaseLoose;
  } catch {
    return null;
  }
}

function parseUsageTimestamp(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 0;
}

async function readPersistedUsage(
  ip: string | null,
  fingerprint: string,
): Promise<number | null> {
  const supabase = db();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("planify_get_planning_trial_usage", {
    p_ip: ip,
    p_fingerprint: fingerprint,
  });

  if (error) {
    console.error("[planning-trial] rate limit read failed:", error);
    if (process.env.NODE_ENV === "production") {
      return Number.MAX_SAFE_INTEGER;
    }
    return null;
  }

  return parseUsageTimestamp(data);
}

async function tryPersistedConsume(
  ip: string | null,
  fingerprint: string,
): Promise<number | null> {
  const supabase = db();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("planify_try_consume_planning_trial_usage", {
    p_ip: ip,
    p_fingerprint: fingerprint,
  });

  if (error) {
    console.error("[planning-trial] atomic consume failed:", error);
    return null;
  }

  return parseUsageTimestamp(data);
}

async function writePersistedUsage(
  ip: string | null,
  fingerprint: string,
): Promise<number | null> {
  const supabase = db();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("planify_consume_planning_trial_usage", {
    p_ip: ip,
    p_fingerprint: fingerprint,
  });

  if (error) {
    console.error("[planning-trial] rate limit write failed:", error);
    return null;
  }

  return parseUsageTimestamp(data);
}

export function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) {
      return ip;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || null;
}

function createFingerprint(): string {
  return crypto.randomUUID();
}

export function resolvePlanningTrialFingerprint(request: NextRequest): string {
  const existing = request.cookies.get(PLANNING_TRIAL_FP_COOKIE)?.value?.trim();
  return existing || createFingerprint();
}

function buildRateLimitKey(ip: string, fingerprint: string): string {
  return `${ip}:${fingerprint}`;
}

function buildIpOnlyKey(ip: string): string {
  return `ip:${ip}`;
}

function resolveEffectiveIp(ip: string | null): string {
  return ip ?? DEV_IP_FALLBACK;
}

function readUsedAtFromCookie(request: NextRequest): number | null {
  const raw = request.cookies.get(PLANNING_TRIAL_USED_COOKIE)?.value?.trim();
  if (!raw) {
    return null;
  }

  const usedAt = Number(raw);
  return Number.isFinite(usedAt) && usedAt > 0 ? usedAt : null;
}

function readMemoryUsage(request: NextRequest, fingerprint: string, ip: string | null): number {
  const effectiveIp = resolveEffectiveIp(ip);
  const compositeUsedAt = memoryUsage.get(buildRateLimitKey(effectiveIp, fingerprint)) ?? 0;
  const ipUsedAt = ip ? (memoryUsage.get(buildIpOnlyKey(ip)) ?? 0) : 0;

  return Math.max(compositeUsedAt, ipUsedAt);
}

function writeMemoryUsage(ip: string | null, fingerprint: string, usedAt: number): void {
  const effectiveIp = resolveEffectiveIp(ip);

  memoryUsage.set(buildRateLimitKey(effectiveIp, fingerprint), usedAt);

  if (ip) {
    memoryUsage.set(buildIpOnlyKey(ip), usedAt);
  }
}

export async function checkPlanningTrialRateLimit(
  request: NextRequest,
): Promise<PlanningTrialRateLimitState> {
  const fingerprint = resolvePlanningTrialFingerprint(request);
  const ip = getClientIp(request);

  if (!ip && process.env.NODE_ENV === "production") {
    return { limited: true, fingerprint };
  }

  const persistedUsedAt = await readPersistedUsage(ip, fingerprint);
  const cookieUsedAt = readUsedAtFromCookie(request) ?? 0;
  const memoryUsedAt = readMemoryUsage(request, fingerprint, ip);
  const usedAt = Math.max(persistedUsedAt ?? 0, cookieUsedAt, memoryUsedAt);

  if (usedAt > 0) {
    return { limited: true, fingerprint };
  }

  return { limited: false, fingerprint };
}

export async function tryConsumePlanningTrialUsage(
  request: NextRequest,
  fingerprint: string,
): Promise<{ consumed: boolean; usedAt: number }> {
  const ip = getClientIp(request);
  const memoryUsedAt = readMemoryUsage(request, fingerprint, ip);

  if (memoryUsedAt > 0) {
    return { consumed: false, usedAt: memoryUsedAt };
  }

  const persistedUsedAt = await tryPersistedConsume(ip, fingerprint);

  if (persistedUsedAt === 0) {
    return { consumed: false, usedAt: 0 };
  }

  if (persistedUsedAt === null) {
    const now = Date.now();
    writeMemoryUsage(ip, fingerprint, now);
    return { consumed: true, usedAt: now };
  }

  writeMemoryUsage(ip, fingerprint, persistedUsedAt);
  return { consumed: true, usedAt: persistedUsedAt };
}

export async function markPlanningTrialUsage(
  request: NextRequest,
  fingerprint: string,
): Promise<number> {
  const now = Date.now();
  const ip = getClientIp(request);

  writeMemoryUsage(ip, fingerprint, now);

  const persistedUsedAt = await writePersistedUsage(ip, fingerprint);
  return persistedUsedAt ?? now;
}

export function applyPlanningTrialUsageCookies(
  request: NextRequest,
  response: NextResponse,
  fingerprint: string,
  usedAt: number,
): void {
  if (!request.cookies.get(PLANNING_TRIAL_FP_COOKIE)?.value) {
    response.cookies.set(PLANNING_TRIAL_FP_COOKIE, fingerprint, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: FP_MAX_AGE,
      path: "/",
    });
  }

  response.cookies.set(PLANNING_TRIAL_USED_COOKIE, String(usedAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: USED_COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function recordPlanningTrialUsage(
  request: NextRequest,
  response: NextResponse,
  fingerprint: string,
): Promise<void> {
  const usedAt = await markPlanningTrialUsage(request, fingerprint);
  applyPlanningTrialUsageCookies(request, response, fingerprint, usedAt);
}
