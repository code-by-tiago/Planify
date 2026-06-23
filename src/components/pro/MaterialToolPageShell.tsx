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
}: MaterialToolPageShellProps) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("form");

  useEffect(() => {
    if (previewReady) {
      setMobilePanel("preview");
    }
  }, [previewReady]);

  useEffect(() => {
    if (previewLoading) {
      setMobilePanel("preview");
    }
  }, [previewLoading]);

  return (
    <div
      className={`planify-hud flex h-full min-h-0 flex-col overflow-hidden ${
        studioMode
          ? ""
          : "rounded-[2rem] border border-slate-200 bg-white shadow-sm"
      }`}
    >
      {!studioMode && onBack ? (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-cyan-400/15 bg-white/85 px-4 py-2.5 backdrop-blur-sm sm:gap-3 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
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
            className="pl-hud-btn-secondary flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
          >
            <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
            <span className="hidden sm:inline">{backLabel}</span>
          </button>
        </div>
      ) : null}

      <div
        className="flex shrink-0 gap-2 border-b border-cyan-400/10 bg-white/90 px-3 py-2 lg:hidden"
        role="tablist"
        aria-label="Painel da ferramenta"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === "form"}
          onClick={() => setMobilePanel("form")}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
            mobilePanel === "form"
              ? "bg-cyan-600 text-white shadow-sm"
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
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
            mobilePanel === "preview"
              ? "bg-cyan-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {previewLoading ? "Gerando…" : previewReady ? "Resultado" : "Prévia"}
        </button>
      </div>

      <div
        className={`grid min-h-0 flex-1 max-lg:grid-cols-1 lg:grid-cols-[0.88fr_1.12fr] ${
          studioMode ? "min-h-0" : "min-h-0 lg:min-h-[680px]"
        }`}
      >
        <div
          {...(formScrollAttr ? { "data-planify-scroll": "" } : {})}
          className={`min-h-0 overflow-y-auto overscroll-contain bg-white/50 p-4 sm:p-5 lg:border-r lg:border-cyan-400/10 lg:max-h-none ${
            mobilePanel === "form" ? "max-lg:flex max-lg:flex-1 max-lg:flex-col" : "max-lg:hidden"
          }`}
        >
          <div className="max-lg:pb-[max(5.5rem,env(safe-area-inset-bottom))]">{form}</div>
        </div>
        <div
          {...(previewScrollAttr ? { "data-planify-scroll": "" } : {})}
          className={`min-h-0 overflow-y-auto overscroll-contain bg-gradient-to-br from-cyan-50/30 via-white/70 to-white p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 ${
            mobilePanel === "preview" ? "max-lg:flex max-lg:flex-1 max-lg:flex-col" : "max-lg:hidden"
          }`}
        >
          <div className="pl-hud-glass min-h-[min(50vh,280px)] flex-1 rounded-2xl p-3 sm:min-h-[280px] sm:p-5">
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}
