import type { NextRequest } from "next/server";
import { getClientIp } from "./planning-trial-rate-limit";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 40;

const memoryHits = new Map<string, number[]>();

function pruneHits(timestamps: number[], now: number): number[] {
  return timestamps.filter((value) => now - value < WINDOW_MS);
}

export function checkPlanningTrialBnccRateLimit(request: NextRequest): {
  limited: boolean;
  retryAfterMs?: number;
} {
  const ip = getClientIp(request) ?? "dev-local";
  const now = Date.now();
  const hits = pruneHits(memoryHits.get(ip) ?? [], now);

  if (hits.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = hits[0] ?? now;
    return { limited: true, retryAfterMs: Math.max(0, WINDOW_MS - (now - oldest)) };
  }

  hits.push(now);
  memoryHits.set(ip, hits);
  return { limited: false };
}
