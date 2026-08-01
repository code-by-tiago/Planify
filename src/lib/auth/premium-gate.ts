export type PremiumGateStatus = {
  authenticated: boolean;
  premium: boolean;
  email?: string;
};

export function getCurrentPathWithSearch(fallbackPath: string): string {
  if (typeof window === "undefined") return fallbackPath;
  return `${window.location.pathname}${window.location.search || ""}`;
}

export function buildLoginRedirect(path: string): string {
  return `/login?premium=required&redirect=${encodeURIComponent(path)}`;
}

export function buildPlansRedirect(path: string): string {
  return `/planos?premium=required&redirect=${encodeURIComponent(path)}`;
}
