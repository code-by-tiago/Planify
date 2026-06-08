"use client";

import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
} from "@/components/google/google-icon-button-styles";
import {
  fetchGoogleStatus,
  startGoogleOAuth,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import {
  clearGoogleExportPending,
  hasExportableHtml,
  openGoogleExportUrl,
  readGoogleExportPending,
  saveGoogleExportPending,
  waitForExportableHtml,
  waitForGoogleConnected,
} from "@/lib/google/google-export-resume";
import {
  GOOGLE_STATUS_CHANGED_EVENT,
  notifyGoogleStatusChanged,
} from "@/lib/google/google-status-events";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type GoogleProductExportButtonProps = {
  title: string;
  getHtml: () => string;
  returnTo?: string;
  className?: string;
  iconOnly?: boolean;
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
  onExport: (html: string) => Promise<{ openUrl: string }>;
  onStatus?: (message: string) => void;
};

export function GoogleProductExportButton({
  title,
  getHtml,
  returnTo = "/dashboard?secao=editor",
  className = "",
  iconOnly = true,
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

  const resolveHtmlForExport = useCallback(async (): Promise<string> => {
    const pending = readGoogleExportPending(pendingStorageKey);
    const snapshot = pending?.html?.trim() || "";

    if (snapshot && hasExportableHtml(snapshot)) {
      return snapshot;
    }

    return waitForExportableHtml(getHtml);
  }, [getHtml, pendingStorageKey]);

  const runExport = useCallback(async () => {
    setBusy(true);
    setError("");

    try {
      const html = await resolveHtmlForExport();

      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f33ae7" },
        body: JSON.stringify({
          sessionId: "f33ae7",
          runId: "pre-fix",
          hypothesisId: "H-A",
          location: "GoogleProductExportButton.tsx:runExport",
          message: "html resolved for export",
          data: {
            productName,
            htmlLen: html.length,
            exportable: hasExportableHtml(html),
            pendingKey: pendingStorageKey,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (!hasExportableHtml(html)) {
        throw new Error("O documento ainda não carregou. Aguarde e tente exportar novamente.");
      }

      const result = await onExport(html);
      clearGoogleExportPending(pendingStorageKey);

      const opened = openGoogleExportUrl(result.openUrl);

      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f33ae7" },
        body: JSON.stringify({
          sessionId: "f33ae7",
          runId: "pre-fix",
          hypothesisId: "H-C",
          location: "GoogleProductExportButton.tsx:runExport",
          message: "export completed",
          data: {
            productName,
            opened,
            openUrlHost: (() => {
              try {
                return new URL(result.openUrl).host;
              } catch {
                return "invalid";
              }
            })(),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (opened) {
        onStatus?.(`${productName} aberto em nova aba.`);
      } else {
        onStatus?.(`${productName} criado. Permita pop-ups ou abra: ${result.openUrl}`);
        setError("Pop-up bloqueado. Permita janelas do Planify e clique de novo.");
      }
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
  }, [onExport, onStatus, pendingStorageKey, productName, resolveHtmlForExport]);

  const runConnect = useCallback(async () => {
    setBusy(true);
    setError("");

    saveGoogleExportPending(pendingStorageKey, {
      title,
      returnTo,
      html: getHtml(),
    });

    try {
      await startGoogleOAuth(returnTo);
    } catch (err) {
      clearGoogleExportPending(pendingStorageKey);
      setError(err instanceof Error ? err.message : "Erro ao conectar Google.");
      setBusy(false);
    }
  }, [getHtml, pendingStorageKey, returnTo, title]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      clearGoogleExportPending(pendingStorageKey);
      params.delete("google_error");
      const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
      window.history.replaceState({}, "", next);
      return;
    }

    if (params.get("google") !== "connected") return;

    const pending = readGoogleExportPending(pendingStorageKey);
    if (!pending?.title) return;

    autoExportStarted.current = true;

    params.delete("google");
    const next = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, "");
    window.history.replaceState({}, "", next);

    void (async () => {
      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f33ae7" },
        body: JSON.stringify({
          sessionId: "f33ae7",
          runId: "pre-fix",
          hypothesisId: "H-D",
          location: "GoogleProductExportButton.tsx:oauthResume",
          message: "oauth resume started",
          data: {
            productName,
            pendingTitle: pending?.title,
            pendingHtmlLen: pending?.html?.length ?? 0,
            returnTo: pending?.returnTo,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const fresh = await waitForGoogleConnected(refresh);
      notifyGoogleStatusChanged();

      // #region agent log
      fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f33ae7" },
        body: JSON.stringify({
          sessionId: "f33ae7",
          runId: "pre-fix",
          hypothesisId: "H-B",
          location: "GoogleProductExportButton.tsx:oauthResume",
          message: "google status after oauth",
          data: {
            productName,
            connected: Boolean(fresh?.connected),
            configured: Boolean(fresh?.configured),
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      if (!fresh?.connected) {
        setError("Google conectado, mas a sessão ainda não sincronizou. Clique no botão novamente.");
        return;
      }

      await runExport();
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

  const defaultClassName = iconOnly
    ? GOOGLE_ICON_ONLY_BUTTON_CLASS
    : "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white transition hover:bg-sky-700 disabled:opacity-60";

  const resolvedClassName = className || defaultClassName;

  if (loading) {
    if (iconOnly) {
      return (
        <button
          type="button"
          disabled
          className={resolvedClassName}
          aria-label={productName}
          title={productName}
        >
          <span className="opacity-50">{icon}</span>
        </button>
      );
    }

    return (
      <span className="text-[11px] font-semibold text-sky-700">{productName}…</span>
    );
  }

  if (!status?.configured) {
    if (iconOnly) {
      return (
        <button
          type="button"
          disabled
          className={resolvedClassName}
          aria-label={configLabel}
          title="Configure GOOGLE_CLIENT_ID no servidor"
        >
          <span className="opacity-50">{icon}</span>
        </button>
      );
    }

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

  const actionTitle = exportTitle || exportLabel;

  if (alwaysShowExport || status.connected) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handlePrimaryAction()}
          className={resolvedClassName}
          aria-label={exportLabel}
          title={actionTitle}
        >
          {iconOnly ? icon : (
            <>
              {icon}
              {exportLabel}
            </>
          )}
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
    const loginTitle = loginLabel;

    return (
      <a
        href={`/login?redirect=${encodeURIComponent(returnTo)}`}
        className={
          className ||
          (iconOnly
            ? GOOGLE_ICON_ONLY_BUTTON_CLASS
            : "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700")
        }
        aria-label={loginTitle}
        title={loginTitle}
      >
        {iconOnly ? icon : (
          <>
            {icon}
            {loginLabel}
          </>
        )}
      </a>
    );
  }

  const connectLabel = busy ? labels.connecting : labels.connect;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void runConnect()}
      className={resolvedClassName}
      aria-label={connectLabel}
      title={connectLabel}
    >
      {iconOnly ? icon : (
        <>
          {icon}
          {busy ? "Google…" : labels.connect}
        </>
      )}
    </button>
  );
}
