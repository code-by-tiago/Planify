import type { NextRequest } from "next/server";

type RateLimitOptions = {
  maxRequests: number;
  windowMs: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function pruneBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function consumePublicApiRateLimit(
  scope: string,
  clientKey: string,
  options: RateLimitOptions,
): { limited: boolean; retryAfterMs?: number } {
  const now = Date.now();
  pruneBuckets(now);

  const bucketKey = `${scope}:${clientKey}`;
  const existing = buckets.get(bucketKey);

  if (!existing || now >= existing.resetAt) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return { limited: false };
  }

  if (existing.count >= options.maxRequests) {
    return {
      limited: true,
      retryAfterMs: Math.max(0, existing.resetAt - now),
    };
  }

  existing.count += 1;
  buckets.set(bucketKey, existing);
  return { limited: false };
}

export function rateLimitResponse(retryAfterMs?: number): Response {
  const retryAfterSeconds = retryAfterMs
    ? Math.max(1, Math.ceil(retryAfterMs / 1000))
    : 60;

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        message: "Muitas tentativas. Aguarde um momento e tente novamente.",
      },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
