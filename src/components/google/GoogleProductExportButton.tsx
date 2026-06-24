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
} from "@/lib/google/google-export-resume";
import { normalizeGoogleOAuthReturnTo } from "@/lib/google/document-type-detection";
import {
  GOOGLE_STATUS_CHANGED_EVENT,
  notifyGoogleStatusChanged,
} from "@/lib/google/google-status-events";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

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
  getPlanningPayload?: () => Record<string, unknown> | null;
  onExport: (params: {
    html: string;
    planningPayload?: Record<string, unknown> | null;
    previewWindow?: Window | null;
  }) => Promise<{ openUrl: string; openedInPreview?: boolean }>;
  onStatus?: (message: string) => void;
  onExportError?: (error: unknown) => void;
  /** Quando falso, inicia OAuth em vez de exportar (ex.: Forms sem escopo forms.body). */
  isExportReady?: (status: GoogleIntegrationStatus) => boolean;
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
  getPlanningPayload,
  onExport,
  onStatus,
  onExportError,
  isExportReady = (value) => value.connected,
}: GoogleProductExportButtonProps) {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  const runExport = useCallback(async (
    previewWindow?: Window | null,
    options?: { fallbackToSameTab?: boolean },
  ) => {
    setBusy(true);
    setError("");

    try {
      const html = await resolveHtmlForExport();

      if (!hasExportableHtml(html)) {
        previewWindow?.close();
        throw new Error("O documento ainda não carregou. Aguarde e tente exportar novamente.");
      }

      const pending = readGoogleExportPending(pendingStorageKey);
      const pendingPayload = pending?.planningPayload;
      const planningPayload =
        pendingPayload ?? getPlanningPayload?.() ?? null;

      const result = await onExport({ html, planningPayload, previewWindow });
      clearGoogleExportPending(pendingStorageKey);

      const opened =
        result.openedInPreview ||
        (!previewWindow?.closed && previewWindow
          ? (() => {
              previewWindow.location.href = result.openUrl;
              return true;
            })()
          : openGoogleExportUrl(result.openUrl));

      if (!opened && !previewWindow && options?.fallbackToSameTab) {
        window.location.assign(result.openUrl);
      } else if (opened) {
        onStatus?.(`${productName} aberto em nova aba.`);
      } else {
        onStatus?.(`${productName} criado. Permita pop-ups ou abra: ${result.openUrl}`);
        setError("Pop-up bloqueado. Permita janelas do Planify e clique de novo.");
      }
    } catch (err) {
      previewWindow?.close();
      onExportError?.(err);
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
  }, [onExport, onExportError, onStatus, pendingStorageKey, productName, resolveHtmlForExport, getPlanningPayload]);

  const runConnect = useCallback(async () => {
    setBusy(true);
    setError("");

    saveGoogleExportPending(pendingStorageKey, {
      title,
      returnTo: normalizeGoogleOAuthReturnTo(returnTo),
      html: getHtml(),
      planningPayload: getPlanningPayload?.() ?? null,
    });

    try {
      await startGoogleOAuth(normalizeGoogleOAuthReturnTo(returnTo), { selectAccount: true });
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

  function handlePrimaryAction() {
    const likelyExport = Boolean(status?.connected && isExportReady(status));
    const previewWindow = likelyExport ? window.open("about:blank", "_blank") : null;
    void handlePrimaryActionAsync(previewWindow);
  }

  async function handlePrimaryActionAsync(previewWindow: Window | null) {
    const fresh = (await refresh()) ?? status;

    if (!fresh?.configured) {
      previewWindow?.close();
      return;
    }

    if (!fresh.authenticated) {
      previewWindow?.close();
      window.location.href = `/login?redirect=${encodeURIComponent(returnTo)}`;
      return;
    }

    if (!isExportReady(fresh)) {
      previewWindow?.close();
      await runConnect();
      return;
    }

    await runExport(previewWindow);
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
          onClick={handlePrimaryAction}
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
