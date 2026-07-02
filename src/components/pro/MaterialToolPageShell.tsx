"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyTool } from "@/lib/pro/planifyTools";

type MobilePanel = "form" | "preview";

type MaterialToolPageShellProps = {
  tool: PlanifyTool;
  studioMode?: boolean;
  onBack?: () => void;
  backLabel?: string;
  form: ReactNode;
  preview: ReactNode;
  formScrollAttr?: boolean;
  previewScrollAttr?: boolean;
  /** When true on mobile, switches to the preview tab (e.g. after generation). */
  previewReady?: boolean;
  previewLoading?: boolean;
  fullWidth?: boolean;
};

/**
 * Split layout chrome for material IA tools — form left, preview right.
 * On mobile: tabbed panels (Configurar | Resultado) for full-height usability.
 */
export function MaterialToolPageShell({
  tool,
  studioMode = false,
  onBack,
  backLabel = "Voltar",
  form,
  preview,
  formScrollAttr = false,
  previewScrollAttr = false,
  previewReady = false,
  previewLoading = false,
  fullWidth = false,
}: MaterialToolPageShellProps) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("form");
  const showPreviewPanel = !fullWidth && (previewReady || previewLoading);

  useEffect(() => {
    if (fullWidth) {
      setMobilePanel("form");
      return;
    }
    if (previewReady) {
      setMobilePanel("preview");
    }
  }, [fullWidth, previewReady]);

  useEffect(() => {
    if (fullWidth) return;
    if (previewLoading) {
      setMobilePanel("preview");
    }
  }, [fullWidth, previewLoading]);

  return (
    <div
      className={`planify-hud flex h-full min-h-0 flex-col overflow-hidden ${
        studioMode
          ? ""
          : "rounded-2xl border border-slate-200 bg-white shadow-sm"
      }`}
    >
      {!studioMode && onBack ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 bg-white px-4 py-3 sm:gap-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
            >
              <PlanifyIcon name={tool.icon} className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                {tool.shortTitle}
              </p>
              <p className="line-clamp-2 text-sm font-semibold tracking-tight text-slate-900">
                {tool.title}
              </p>
              <p className="hidden line-clamp-2 text-xs leading-snug text-slate-500 sm:block">
                {tool.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        </div>
      ) : null}

      <div
        className={`shrink-0 gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:hidden ${
          fullWidth || !showPreviewPanel ? "hidden" : "flex"
        }`}
        role="tablist"
        aria-label="Painel da ferramenta"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === "form"}
          onClick={() => setMobilePanel("form")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
            mobilePanel === "form"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          Configurar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === "preview"}
          onClick={() => setMobilePanel("preview")}
          className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
            mobilePanel === "preview"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {previewLoading ? "Gerando…" : previewReady ? "Resultado" : "Prévia"}
        </button>
      </div>

      <div
        className={`grid min-h-0 flex-1 max-lg:grid-cols-1 ${
          fullWidth || !showPreviewPanel ? "lg:grid-cols-1" : "lg:grid-cols-[0.88fr_1.12fr]"
        } ${studioMode ? "min-h-0" : "min-h-0 lg:min-h-[680px]"}`}
      >
        <div
          {...(formScrollAttr ? { "data-planify-scroll": "" } : {})}
          className={`min-h-0 overflow-y-auto overscroll-contain bg-white/50 p-4 sm:p-5 lg:max-h-none ${
            fullWidth || !showPreviewPanel ? "" : "lg:border-r lg:border-slate-200"
          } ${
            fullWidth || !showPreviewPanel || mobilePanel === "form"
              ? "max-lg:flex max-lg:flex-1 max-lg:flex-col"
              : "max-lg:hidden"
          }`}
        >
          <div
            className={`max-lg:pb-[max(5.5rem,env(safe-area-inset-bottom))] ${
              fullWidth || showPreviewPanel ? "" : "mx-auto w-full max-w-3xl"
            }`}
          >
            {form}
          </div>
        </div>
        {showPreviewPanel ? (
          <div
            {...(previewScrollAttr ? { "data-planify-scroll": "" } : {})}
            className={`min-h-0 overflow-y-auto overscroll-contain bg-slate-50 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 ${
              mobilePanel === "preview" ? "max-lg:flex max-lg:flex-1 max-lg:flex-col" : "max-lg:hidden"
            }`}
          >
            <div className="min-h-[220px] flex-1 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
              {preview}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
