import type { NextRequest } from "next/server";

const ALLOWED_ORIGIN_SUFFIXES = [
  "iaplanify.com.br",
  "planify.pro",
  "localhost",
  "127.0.0.1",
  ".vercel.app",
];

function isAllowedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().split(":")[0] ?? "";
  return ALLOWED_ORIGIN_SUFFIXES.some(
    (suffix) => host === suffix.replace(/^\./, "") || host.endsWith(suffix),
  );
}

function parseOriginHost(value: string | null): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

export function isPlanningTrialRequestOriginAllowed(request: NextRequest): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const originHost = parseOriginHost(request.headers.get("origin"));
  const refererHost = parseOriginHost(request.headers.get("referer"));

  if (originHost && isAllowedHost(originHost)) {
    return true;
  }

  if (refererHost && isAllowedHost(refererHost)) {
    return true;
  }

  return !originHost && !refererHost;
}
