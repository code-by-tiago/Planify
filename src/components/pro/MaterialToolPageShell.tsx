"use client";

import type { ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyTool } from "@/lib/pro/planifyTools";

type MaterialToolPageShellProps = {
  tool: PlanifyTool;
  studioMode?: boolean;
  onBack?: () => void;
  backLabel?: string;
  form: ReactNode;
  preview: ReactNode;
  formScrollAttr?: boolean;
  previewScrollAttr?: boolean;
};

/**
 * Split layout chrome for material IA tools — form left, preview right.
 * Hero for dashboard studio mode lives in TeachyMateriaisStudio.
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
}: MaterialToolPageShellProps) {
  return (
    <div
      className={`planify-hud flex h-full min-h-0 flex-col overflow-hidden ${
        studioMode
          ? ""
          : "rounded-[2rem] border border-cyan-400/20 bg-white shadow-[0_8px_40px_-16px_rgba(0,212,255,0.12)]"
      }`}
    >
      {!studioMode && onBack ? (
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-cyan-400/15 bg-white/85 px-5 py-4 backdrop-blur-sm">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tool.accent} text-white shadow-sm`}
            >
              <PlanifyIcon name={tool.icon} className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600">
                {tool.shortTitle}
              </p>
              <p className="truncate text-sm font-extrabold text-slate-950">
                {tool.title}
              </p>
              <p className="hidden truncate text-xs font-medium text-slate-500 sm:block">
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
        className={`grid min-h-0 flex-1 lg:grid-cols-[0.92fr_1.08fr] ${
          studioMode ? "min-h-0" : "min-h-[600px] lg:min-h-[680px]"
        }`}
      >
        <div
          {...(formScrollAttr ? { "data-planify-scroll": "" } : {})}
          className="min-h-0 overflow-y-auto overscroll-contain border-r border-cyan-400/10 bg-white/50 p-4 sm:p-5"
        >
          {form}
        </div>
        <div
          {...(previewScrollAttr ? { "data-planify-scroll": "" } : {})}
          className="min-h-0 overflow-y-auto overscroll-contain bg-gradient-to-br from-cyan-50/30 via-white/70 to-white p-4 sm:p-5"
        >
          <div className="pl-hud-glass min-h-[280px] rounded-2xl p-4 sm:p-5">
            {preview}
          </div>
        </div>
      </div>
    </div>
  );
}
