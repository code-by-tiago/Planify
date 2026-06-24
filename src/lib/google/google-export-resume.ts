export type GoogleExportPending = {
  title: string;
  returnTo: string;
  html?: string;
  planningPayload?: Record<string, unknown> | null;
  ts: number;
};

const PENDING_TTL_MS = 30 * 60 * 1000;

/** Session keys used to resume Google export after OAuth — only one may be active. */
export const GOOGLE_EXPORT_PENDING_KEYS = [
  "planify:google-docs-export-pending",
  "planify:google-drive-export-pending",
  "planify:google-forms-export-pending",
] as const;

export type GoogleExportPendingKey = (typeof GOOGLE_EXPORT_PENDING_KEYS)[number];

export const GOOGLE_OAUTH_RETURN_LOCK_KEY = "planify:google-oauth-return-lock";
export const GOOGLE_OAUTH_RESUME_ACTIVE_KEY = "planify:google-oauth-resume-active";

const OAUTH_RESUME_TTL_MS = 2 * 60 * 1000;

export type GoogleOAuthReturnSignal = {
  connected: boolean;
  error: string | null;
};

export function peekGoogleOAuthReturnSignal(): GoogleOAuthReturnSignal | null {
  if (typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);
  const google = params.get("google");
  const googleError = params.get("google_error");

  if (google !== "connected" && !googleError) return null;

  return {
    connected: google === "connected",
    error: googleError ? decodeURIComponent(googleError) : null,
  };
}

export function clearGoogleOAuthReturnParams(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  if (!params.has("google") && !params.has("google_error")) return;

  params.delete("google");
  params.delete("google_error");
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  window.history.replaceState({}, "", next);
}

export function releaseGoogleOAuthReturnLock(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GOOGLE_OAUTH_RETURN_LOCK_KEY);
}

export function clearGoogleOAuthResumeActive(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(GOOGLE_OAUTH_RESUME_ACTIVE_KEY);
  releaseGoogleOAuthReturnLock();
}

function markGoogleOAuthResumeActive(): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(GOOGLE_OAUTH_RESUME_ACTIVE_KEY, String(Date.now()));
}

function readGoogleOAuthResumeActive(): GoogleOAuthReturnSignal | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(GOOGLE_OAUTH_RESUME_ACTIVE_KEY);
    if (!raw) return null;

    const age = Date.now() - Number(raw);
    if (!Number.isFinite(age) || age > OAUTH_RESUME_TTL_MS) {
      clearGoogleOAuthResumeActive();
      return null;
    }

    return { connected: true, error: null };
  } catch {
    return null;
  }
}

/** Lê o sinal OAuth da URL uma única vez por retorno (evita corrida entre componentes). */
export function consumeGoogleOAuthReturnSignal(): GoogleOAuthReturnSignal | null {
  const fromUrl = peekGoogleOAuthReturnSignal();

  if (fromUrl) {
    try {
      const consumedAt = window.sessionStorage.getItem(GOOGLE_OAUTH_RETURN_LOCK_KEY);
      if (consumedAt) {
        const age = Date.now() - Number(consumedAt);
        if (age < 3_000) {
          return readGoogleOAuthResumeActive();
        }
      }
      window.sessionStorage.setItem(GOOGLE_OAUTH_RETURN_LOCK_KEY, String(Date.now()));
    } catch {
      return null;
    }

    clearGoogleOAuthReturnParams();
    markGoogleOAuthResumeActive();
    return fromUrl;
  }

  return readGoogleOAuthResumeActive();
}

/** URL params ou sessão ativa de retomada pós-OAuth (para retries após limpar a URL). */
export function peekGoogleOAuthResumeIntent(): GoogleOAuthReturnSignal | null {
  return peekGoogleOAuthReturnSignal() ?? readGoogleOAuthResumeActive();
}

export function hasAnyGoogleExportPending(keys: readonly string[]): boolean {
  if (typeof window === "undefined") return false;
  return keys.some((key) => {
    const pending = readGoogleExportPending(key);
    return Boolean(pending?.title);
  });
}

export function clearOtherGoogleExportPending(activeKey: string): void {
  if (typeof window === "undefined") return;

  for (const key of GOOGLE_EXPORT_PENDING_KEYS) {
    if (key !== activeKey) {
      window.sessionStorage.removeItem(key);
    }
  }
}

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

  clearOtherGoogleExportPending(key);

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
  maxAttempts = 25,
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

export async function waitForFormsExportReady<T extends {
  connected?: boolean;
  formsScopeGranted?: boolean;
}>(
  refresh: () => Promise<T | null>,
  maxAttempts = 30,
): Promise<T | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const fresh = await refresh();
    if (fresh?.connected && fresh.formsScopeGranted === true) {
      return fresh;
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 400));
    }
  }

  return null;
}

export function openGoogleExportUrl(url: string): boolean {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  return opened !== null;
}
