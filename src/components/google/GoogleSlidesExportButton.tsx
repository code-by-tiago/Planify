"use client";

import {
  exportToGoogleSlides,
  fetchGoogleStatus,
  startGoogleOAuth,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import {
  clearGoogleSlidesExportPending,
  GOOGLE_STATUS_CHANGED_EVENT,
  notifyGoogleStatusChanged,
  readGoogleSlidesExportPending,
  saveGoogleSlidesExportPending,
} from "@/lib/google/google-status-events";
import { useCallback, useEffect, useRef, useState } from "react";

export type PlanifySlideExportPayload = {
  title: string;
  bullets: string[];
  speakerNotes: string;
  layout?: string;
  subtitle?: string;
  imagePrompt?: string;
  imageUrl?: string;
  imageAlt?: string;
  sequenceStep?: number;
  sequenceLabel?: string;
};

type GoogleSlidesExportButtonProps = {
  title: string;
  html?: string;
  getHtml?: () => string;
  slides?: PlanifySlideExportPayload[];
  theme?: string;
  returnTo?: string;
  className?: string;
  /** Mantém o CTA de exportação visível mesmo antes de conectar o Google. */
  alwaysShowExport?: boolean;
};

export function GoogleSlidesExportButton({
  title,
  html,
  getHtml,
  slides,
  theme,
  returnTo = "/dashboard?tipo=slides",
  className = "",
  alwaysShowExport = false,
}: GoogleSlidesExportButtonProps) {
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
      const result = await exportToGoogleSlides({
        title,
        html: getHtml ? getHtml() : html,
        slides,
        theme,
      });
      clearGoogleSlidesExportPending();
      window.open(result.presentationUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erro ao exportar slides.";

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
  }, [getHtml, html, slides, theme, title]);

  const runConnect = useCallback(async () => {
    setBusy(true);
    setError("");

    saveGoogleSlidesExportPending({
      title,
      theme,
      returnTo,
    });

    try {
      await startGoogleOAuth(returnTo);
    } catch (err) {
      clearGoogleSlidesExportPending();
      setError(err instanceof Error ? err.message : "Erro ao conectar Google.");
      setBusy(false);
    }
  }, [returnTo, theme, title]);

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
      clearGoogleSlidesExportPending();
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

      const pending = readGoogleSlidesExportPending();
      if (fresh?.connected && pending?.title) {
        await runExport();
      }
    })();
  }, [refresh, runExport]);

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

  if (loading) {
    return (
      <span className="text-[11px] font-semibold text-sky-700">Google…</span>
    );
  }

  if (!status?.configured) {
    return (
      <span
        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900"
        title="Configure GOOGLE_CLIENT_ID no servidor"
      >
        Apresentações (config)
      </span>
    );
  }

  const exportLabel =
    busy && status.connected
      ? "Criando…"
      : busy && !status.connected
        ? "Conectando…"
        : status.connected
          ? "Abrir no Google Apresentações"
          : alwaysShowExport
            ? "Conectar e abrir no Google"
            : "Conectar Google";

  if (alwaysShowExport || status.connected) {
    return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handlePrimaryAction()}
          className={
            className ||
            "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-60"
          }
          title={
            status.connected
              ? "Exporta o deck atual para o Google Apresentações"
              : "Conecte sua conta Google e abra a apresentação"
          }
        >
          {exportLabel}
        </button>
        {status.connected && status.googleEmail ? (
          <span
            className="max-w-[160px] truncate text-[10px] font-semibold text-emerald-800"
            title={status.googleEmail}
          >
            {status.googleEmail}
          </span>
        ) : null}
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
          "inline-flex shrink-0 items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700"
        }
      >
        Apresentações (login)
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void runConnect()}
      className={
        className ||
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white hover:bg-sky-700 disabled:opacity-60"
      }
    >
      {busy ? "Google…" : "Conectar Google"}
    </button>
  );
}
