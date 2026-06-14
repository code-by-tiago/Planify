"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  GOOGLE_ICON_ONLY_BUTTON_CLASS,
  GOOGLE_PRODUCT_ICON_CLASS,
} from "@/components/google/google-icon-button-styles";
import type { PlanifySlideExportPayload } from "@/components/google/GoogleSlidesExportButton";
import { downloadSlidesPptx } from "@/lib/downloads/slides-pptx-export-client";
import { useState } from "react";

type SlidesPptxDownloadButtonProps = {
  title: string;
  html?: string;
  getHtml?: () => string;
  slides?: PlanifySlideExportPayload[];
  theme?: string;
  documentType?: string | null;
  className?: string;
  iconOnly?: boolean;
  label?: string;
};

export function SlidesPptxDownloadButton({
  title,
  html,
  getHtml,
  slides,
  theme,
  documentType,
  className = "",
  iconOnly = true,
  label = "Baixar PPTX",
}: SlidesPptxDownloadButtonProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setBusy(true);
    setError("");
    try {
      await downloadSlidesPptx({
        title,
        html: getHtml?.() ?? html,
        slides,
        theme,
        documentType,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao baixar PPTX.");
    } finally {
      setBusy(false);
    }
  }

  if (iconOnly) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleDownload()}
          className={`${GOOGLE_ICON_ONLY_BUTTON_CLASS} ${className}`}
          aria-label={busy ? "Gerando PPTX…" : label}
          title={busy ? "Gerando PPTX…" : error || label}
        >
          <PlanifyIcon
            name="download"
            className={`${GOOGLE_PRODUCT_ICON_CLASS} text-violet-700`}
          />
        </button>
        {error ? (
          <span className="max-w-[160px] truncate text-[10px] font-semibold text-rose-700" title={error}>
            {error}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void handleDownload()}
        className={`inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-900 transition hover:bg-violet-100 disabled:opacity-60 ${className}`}
      >
        <PlanifyIcon name="download" className="h-4 w-4" />
        {busy ? "Gerando PPTX…" : label}
      </button>
      {error ? (
        <span className="text-xs font-semibold text-rose-700">{error}</span>
      ) : null}
    </div>
  );
}
