"use client";

import {
  fetchGoogleStatus,
  startGoogleOAuth,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import {
  GOOGLE_STATUS_CHANGED_EVENT,
  notifyGoogleStatusChanged,
} from "@/lib/google/google-status-events";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

export type GoogleExportPending = {
  title: string;
  returnTo: string;
  ts: number;
};

type GoogleProductExportButtonProps = {
  title: string;
  returnTo?: string;
  className?: string;
  alwaysShowExport?: boolean;
  icon: ReactNode;
  productName: string;
  configLabel: string;
  loginLabel: string;
  labels: {
    exportConnected: string;
    exportConnect: string;
    creating: string;
    connecting: string;
    connect: string;
  };
  exportTitle?: string;
  pendingStorageKey: string;
  onExport: () => Promise<{ openUrl: string }>;
  onStatus?: (message: string) => void;
};

function readPending(key: string): GoogleExportPending | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as GoogleExportPending;
    if (!parsed?.title || !parsed.returnTo) return null;

    if (Date.now() - (parsed.ts || 0) > 30 * 60 * 1000) {
      window.sessionStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function savePending(key: string, payload: Omit<GoogleExportPending, "ts">): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    key,
    JSON.stringify({ ...payload, ts: Date.now() } satisfies GoogleExportPending),
  );
}

function clearPending(key: string): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

export function GoogleProductExportButton({
  title,
  returnTo = "/dashboard?secao=editor",
  className = "",
  alwaysShowExport = false,
  icon,
  productName,
  configLabel,
  loginLabel,
  labels,
  exportTitle,
  pendingStorageKey,
  onExport,
  onStatus,
}: GoogleProductExportButtonProps) {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const autoExportStarted = useRef(false);

  const refresh = useCallback(async () => {
    setError("");
    try {
      const next = await fetchGoogleStatus();
      setStatus(next);
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar Google.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const runExport = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const result = await onExport();
      clearPending(pendingStorageKey);
      window.open(result.openUrl, "_blank", "noopener,noreferrer");
      onStatus?.(`${productName} aberto em nova aba.`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Erro ao exportar para ${productName}.`;

      if (/não conectada|não conectado/i.test(message)) {
        setStatus((current) =>
          current ? { ...current, connected: false } : current,
        );
        setError("Conecte sua conta Google e tente novamente.");
        notifyGoogleStatusChanged();
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }, [onExport, onStatus, pendingStorageKey, productName]);

  const runConnect = useCallback(async () => {
    setBusy(true);
    setError("");

    savePending(pendingStorageKey, { title, returnTo });

    try {
      await startGoogleOAuth(returnTo);
    } catch (err) {
      clearPending(pendingStorageKey);
      setError(err instanceof Error ? err.message : "Erro ao conectar Google.");
      setBusy(false);
    }
  }, [pendingStorageKey, returnTo, title]);

  useEffect(() => {
    void refresh().then((fresh) => {
      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "82e773" },
        body: JSON.stringify({
          sessionId: "82e773",
          runId: "google-auto-export",
          hypothesisId: "H-A",
          location: "GoogleProductExportButton.tsx:mount",
          message: "product export button mounted",
          data: {
            productName,
            configured: Boolean(fresh?.configured),
            authenticated: Boolean(fresh?.authenticated),
            connected: Boolean(fresh?.connected),
            autoExportOnGeneration: false,
            googleConnectedParam: typeof window !== "undefined"
              ? new URLSearchParams(window.location.search).get("google")
              : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
    });
  }, [refresh, productName]);

  useEffect(() => {
    const onStatusChanged = () => {
      void refresh();
    };

    const onFocus = () => {
      void refresh();
    };

    window.addEventListener(GOOGLE_STATUS_CHANGED_EVENT, onStatusChanged);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener(GOOGLE_STATUS_CHANGED_EVENT, onStatusChanged);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  useEffect(() => {
    if (typeof window === "undefined" || autoExportStarted.current) return;

    const params = new URLSearchParams(window.location.search);
    const googleError = params.get("google_error");

    if (googleError) {
      setError(decodeURIComponent(googleError));
      clearPending(pendingStorageKey);
      params.delete("google_error");
      const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
      window.history.replaceState({}, "", next);
      return;
    }

    if (params.get("google") !== "connected") return;

    params.delete("google");
    const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
    window.history.replaceState({}, "", next);

    autoExportStarted.current = true;

    void (async () => {
      const fresh = await refresh();
      notifyGoogleStatusChanged();

      const pending = readPending(pendingStorageKey);
      if (fresh?.connected && pending?.title) {
        await runExport();
      }
    })();
  }, [pendingStorageKey, refresh, runExport]);

  async function handlePrimaryAction() {
    const fresh = (await refresh()) ?? status;

    if (!fresh?.configured) return;

    if (!fresh.authenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(returnTo)}`;
      return;
    }

    if (!fresh.connected) {
      await runConnect();
      return;
    }

    await runExport();
  }

  const defaultClassName =
    "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white transition hover:bg-sky-700 disabled:opacity-60";

  if (loading) {
    return (
      <span className="text-[11px] font-semibold text-sky-700">{productName}…</span>
    );
  }

  if (!status?.configured) {
    return (
      <span
        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900"
        title="Configure GOOGLE_CLIENT_ID no servidor"
      >
        {configLabel}
      </span>
    );
  }

  const exportLabel =
    busy && status.connected
      ? labels.creating
      : busy && !status.connected
        ? labels.connecting
        : status.connected
          ? labels.exportConnected
          : alwaysShowExport
            ? labels.exportConnect
            : labels.connect;

  if (alwaysShowExport || status.connected) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handlePrimaryAction()}
          className={className || defaultClassName}
          title={exportTitle || labels.exportConnected}
        >
          {icon}
          {exportLabel}
        </button>
        {error ? (
          <span
            className="max-w-[260px] truncate text-[11px] font-semibold text-rose-700"
            title={error}
          >
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  if (!status.authenticated) {
    return (
      <a
        href={`/login?redirect=${encodeURIComponent(returnTo)}`}
        className={
          className ||
          "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
        }
      >
        {icon}
        {loginLabel}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void runConnect()}
      className={className || defaultClassName}
    >
      {icon}
      {busy ? "Google…" : labels.connect}
    </button>
  );
}
