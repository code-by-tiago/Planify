export type GoogleExportPending = {
  title: string;
  returnTo: string;
  html?: string;
  ts: number;
};

const PENDING_TTL_MS = 30 * 60 * 1000;

export function readGoogleExportPending(key: string): GoogleExportPending | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GoogleExportPending;
    if (!parsed?.title || !parsed.returnTo) return null;

    if (Date.now() - (parsed.ts || 0) > PENDING_TTL_MS) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveGoogleExportPending(
  key: string,
  payload: Omit<GoogleExportPending, "ts">,
): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    key,
    JSON.stringify({ ...payload, ts: Date.now() } satisfies GoogleExportPending),
  );
}

export function clearGoogleExportPending(key: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

export function hasExportableHtml(html: string): boolean {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length >= 20;
}

export async function waitForExportableHtml(
  resolveHtml: () => string,
  maxMs = 10_000,
): Promise<string> {
  const started = Date.now();

  while (Date.now() - started < maxMs) {
    const html = resolveHtml().trim();
    if (hasExportableHtml(html)) {
      return html;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }

  return resolveHtml().trim();
}

export async function waitForGoogleConnected<T extends { connected?: boolean }>(
  refresh: () => Promise<T | null>,
  maxAttempts = 10,
): Promise<T | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const fresh = await refresh();
    if (fresh?.connected) {
      return fresh;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
    }
  }

  return null;
}

export function openGoogleExportUrl(url: string): boolean {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return opened !== null;
}
