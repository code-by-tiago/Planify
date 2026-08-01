import type { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export const SIMULATOR_FP_COOKIE = "planify_sim_fp";
export const SIMULATOR_USED_COOKIE = "planify_sim_used";
<<<<<<< HEAD
const WINDOW_MS = 24 * 60 * 60 * 1000;
const FP_MAX_AGE = 60 * 60 * 24 * 365;
=======
/** Cookie/fingerprint lifetime — 1 uso vitalício por dispositivo. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
>>>>>>> origin/aplicar-melhorias-na-producao
const DEV_IP_FALLBACK = "dev-local";

export type RateLimitState = {
  limited: boolean;
  fingerprint: string;
  retryAfterMs?: number;
};

type DbResult = { data: unknown; error: unknown };
type SupabaseLoose = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<DbResult>;
};

const memoryUsage = new Map<string, number>();

<<<<<<< HEAD
function pruneMemoryStore(now = Date.now()): void {
  for (const [key, usedAt] of memoryUsage) {
    if (now - usedAt >= WINDOW_MS) {
      memoryUsage.delete(key);
    }
  }
}

=======
>>>>>>> origin/aplicar-melhorias-na-producao
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

  const { data, error } = await supabase.rpc("planify_get_lesson_simulator_usage", {
    p_ip: ip,
    p_fingerprint: fingerprint,
  });

  if (error) {
    console.error("[lesson-simulator] rate limit read failed:", error);
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

  const { data, error } = await supabase.rpc("planify_consume_lesson_simulator_usage", {
    p_ip: ip,
    p_fingerprint: fingerprint,
  });

  if (error) {
    console.error("[lesson-simulator] rate limit write failed:", error);
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

export function resolveSimulatorFingerprint(request: NextRequest): string {
  const existing = request.cookies.get(SIMULATOR_FP_COOKIE)?.value?.trim();
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
  const raw = request.cookies.get(SIMULATOR_USED_COOKIE)?.value?.trim();
  if (!raw) {
    return null;
  }

  const usedAt = Number(raw);
  return Number.isFinite(usedAt) && usedAt > 0 ? usedAt : null;
}

<<<<<<< HEAD
function readMemoryUsage(request: NextRequest, fingerprint: string, ip: string | null): number {
=======
function readMemoryUsage(_request: NextRequest, fingerprint: string, ip: string | null): number {
>>>>>>> origin/aplicar-melhorias-na-producao
  const effectiveIp = resolveEffectiveIp(ip);
  const compositeUsedAt = memoryUsage.get(buildRateLimitKey(effectiveIp, fingerprint)) ?? 0;
  const ipUsedAt = ip ? (memoryUsage.get(buildIpOnlyKey(ip)) ?? 0) : 0;

  return Math.max(compositeUsedAt, ipUsedAt);
}

function writeMemoryUsage(ip: string | null, fingerprint: string, usedAt: number): void {
  const effectiveIp = resolveEffectiveIp(ip);

<<<<<<< HEAD
  memoryUsage.set(buildRateLimitKey(effectiveIp, fingerprint), usedAt);

  if (ip) {
    memoryUsage.set(buildIpOnlyKey(ip), usedAt);
  }
}

function buildLimitedState(
  fingerprint: string,
  usedAt: number,
  now: number,
): RateLimitState {
  return {
    limited: true,
    fingerprint,
    retryAfterMs: WINDOW_MS - (now - usedAt),
=======
  // Não sobrescrever o primeiro uso — limite vitalício.
  const key = buildRateLimitKey(effectiveIp, fingerprint);
  if (!memoryUsage.has(key)) {
    memoryUsage.set(key, usedAt);
  }

  if (ip) {
    const ipKey = buildIpOnlyKey(ip);
    if (!memoryUsage.has(ipKey)) {
      memoryUsage.set(ipKey, usedAt);
    }
  }
}

function buildLimitedState(fingerprint: string): RateLimitState {
  return {
    limited: true,
    fingerprint,
>>>>>>> origin/aplicar-melhorias-na-producao
  };
}

export async function checkLessonSimulatorRateLimit(
  request: NextRequest,
): Promise<RateLimitState> {
<<<<<<< HEAD
  const now = Date.now();
  pruneMemoryStore(now);

  const fingerprint = resolveSimulatorFingerprint(request);
  const ip = getClientIp(request);

  if (!ip && process.env.NODE_ENV === "production") {
    return {
      limited: true,
      fingerprint,
      retryAfterMs: WINDOW_MS,
    };
=======
  const fingerprint = resolveSimulatorFingerprint(request);

  // Em desenvolvimento, não aplicar o limite vitalício para facilitar testes locais.
  if (process.env.NODE_ENV !== "production") {
    return { limited: false, fingerprint };
  }

  const ip = getClientIp(request);

  if (!ip) {
    return buildLimitedState(fingerprint);
>>>>>>> origin/aplicar-melhorias-na-producao
  }

  const persistedUsedAt = await readPersistedUsage(ip, fingerprint);
  const cookieUsedAt = readUsedAtFromCookie(request) ?? 0;
  const memoryUsedAt = readMemoryUsage(request, fingerprint, ip);
  const usedAt = Math.max(persistedUsedAt ?? 0, cookieUsedAt, memoryUsedAt);

<<<<<<< HEAD
  if (usedAt > 0 && now - usedAt < WINDOW_MS) {
    return buildLimitedState(fingerprint, usedAt, now);
=======
  // Qualquer uso anterior bloqueia para sempre (1 teste por dispositivo/IP).
  if (usedAt > 0) {
    return buildLimitedState(fingerprint);
>>>>>>> origin/aplicar-melhorias-na-producao
  }

  return { limited: false, fingerprint };
}

export async function markLessonSimulatorUsage(
  request: NextRequest,
  fingerprint: string,
): Promise<number> {
  const now = Date.now();
  const ip = getClientIp(request);

  writeMemoryUsage(ip, fingerprint, now);

  const persistedUsedAt = await writePersistedUsage(ip, fingerprint);
  return persistedUsedAt ?? now;
}

export function applyLessonSimulatorUsageCookies(
  request: NextRequest,
  response: NextResponse,
  fingerprint: string,
  usedAt: number,
): void {
  if (!request.cookies.get(SIMULATOR_FP_COOKIE)?.value) {
    response.cookies.set(SIMULATOR_FP_COOKIE, fingerprint, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
<<<<<<< HEAD
      maxAge: FP_MAX_AGE,
=======
      maxAge: COOKIE_MAX_AGE,
>>>>>>> origin/aplicar-melhorias-na-producao
      path: "/",
    });
  }

  response.cookies.set(SIMULATOR_USED_COOKIE, String(usedAt), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
<<<<<<< HEAD
    maxAge: Math.ceil(WINDOW_MS / 1000),
=======
    maxAge: COOKIE_MAX_AGE,
>>>>>>> origin/aplicar-melhorias-na-producao
    path: "/",
  });
}

export async function recordLessonSimulatorUsage(
  request: NextRequest,
  response: NextResponse,
  fingerprint: string,
): Promise<void> {
  const usedAt = await markLessonSimulatorUsage(request, fingerprint);
  applyLessonSimulatorUsageCookies(request, response, fingerprint, usedAt);
}
