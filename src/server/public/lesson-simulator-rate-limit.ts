import type { NextRequest, NextResponse } from "next/server";

export const SIMULATOR_FP_COOKIE = "planify_sim_fp";
export const SIMULATOR_USED_COOKIE = "planify_sim_used";
const WINDOW_MS = 24 * 60 * 60 * 1000;
const FP_MAX_AGE = 60 * 60 * 24 * 365;

type RateLimitState = {
  limited: boolean;
  fingerprint: string;
  retryAfterMs?: number;
};

const memoryUsage = new Map<string, number>();

function pruneMemoryStore(now = Date.now()): void {
  for (const [key, usedAt] of memoryUsage) {
    if (now - usedAt >= WINDOW_MS) {
      memoryUsage.delete(key);
    }
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
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

function readUsedAtFromCookie(request: NextRequest): number | null {
  const raw = request.cookies.get(SIMULATOR_USED_COOKIE)?.value?.trim();
  if (!raw) {
    return null;
  }

  const usedAt = Number(raw);
  return Number.isFinite(usedAt) && usedAt > 0 ? usedAt : null;
}

export function checkLessonSimulatorRateLimit(request: NextRequest): RateLimitState {
  const now = Date.now();
  pruneMemoryStore(now);

  const fingerprint = resolveSimulatorFingerprint(request);
  const ip = getClientIp(request);
  const key = buildRateLimitKey(ip, fingerprint);

  const cookieUsedAt = readUsedAtFromCookie(request);
  const memoryUsedAt = memoryUsage.get(key);

  const usedAt = Math.max(cookieUsedAt ?? 0, memoryUsedAt ?? 0);
  if (usedAt > 0 && now - usedAt < WINDOW_MS) {
    return {
      limited: true,
      fingerprint,
      retryAfterMs: WINDOW_MS - (now - usedAt),
    };
  }

  return { limited: false, fingerprint };
}

export function recordLessonSimulatorUsage(
  request: NextRequest,
  response: NextResponse,
  fingerprint: string,
): void {
  const now = Date.now();
  const ip = getClientIp(request);
  const key = buildRateLimitKey(ip, fingerprint);

  memoryUsage.set(key, now);

  if (!request.cookies.get(SIMULATOR_FP_COOKIE)?.value) {
    response.cookies.set(SIMULATOR_FP_COOKIE, fingerprint, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: FP_MAX_AGE,
      path: "/",
    });
  }

  response.cookies.set(SIMULATOR_USED_COOKIE, String(now), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.ceil(WINDOW_MS / 1000),
    path: "/",
  });
}
