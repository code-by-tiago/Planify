import { SEO } from "./constants";

const PRODUCTION_URL = SEO.domain;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function isVercelAppHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".vercel.app");
  } catch {
    return url.includes(".vercel.app");
  }
}

/**
 * Canonical base URL for metadata, sitemap and robots.
 * Production always resolves to https://iaplanify.com.br (never vercel.app).
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicit) {
    const normalized = stripTrailingSlash(explicit);
    if (process.env.VERCEL_ENV === "production" && isVercelAppHost(normalized)) {
      return PRODUCTION_URL;
    }
    return normalized;
  }

  if (process.env.VERCEL_ENV === "production") {
    return PRODUCTION_URL;
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl && process.env.VERCEL_ENV === "preview") {
    return `https://${stripTrailingSlash(vercelUrl)}`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return PRODUCTION_URL;
}
