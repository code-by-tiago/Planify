"use client";

import {
  exportToGoogleSlides,
  fetchGoogleStatus,
  startGoogleOAuth,
  type GoogleIntegrationStatus,
} from "@/lib/google/google-api-client";
import { useCallback, useEffect, useState } from "react";

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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStatus(await fetchGoogleStatus());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar Google.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleConnect() {
    setBusy(true);
    setError("");
    try {
      await startGoogleOAuth(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar Google.");
      setBusy(false);
    }
  }

  async function handleExport() {
    setBusy(true);
    setError("");
    try {
      const result = await exportToGoogleSlides({
        title,
        html: getHtml ? getHtml() : html,
        slides,
        theme,
      });
      window.open(result.presentationUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao exportar slides.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePrimaryAction() {
    if (!status?.configured) return;
    if (!status.authenticated) {
      window.location.href = `/login?redirect=${encodeURIComponent(returnTo)}`;
      return;
    }
    if (!status.connected) {
      await handleConnect();
      return;
    }
    await handleExport();
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
            ? "Abrir no Google Apresentações"
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
        {error ? (
          <span
            className="max-w-[220px] truncate text-[11px] font-semibold text-rose-700"
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
      onClick={() => void handleConnect()}
      className={
        className ||
        "inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-black text-white hover:bg-sky-700 disabled:opacity-60"
      }
    >
      {busy ? "Google…" : "Conectar Google"}
    </button>
  );
}
