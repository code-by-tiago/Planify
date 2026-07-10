"use client";

import { HUD_FORM_PANEL_CLASS } from "@/lib/pro/hud-form-styles";
import type { ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { PlanifyTool } from "@/lib/pro/planifyTools";

type MaterialToolPageShellProps = {
  tool: PlanifyTool;
  studioMode?: boolean;
  onBack?: () => void;
  backLabel?: string;
  form: ReactNode;
  formScrollAttr?: boolean;
  fullWidth?: boolean;
  /** Quando falso, não envolve o formulário no painel vidro padrão (ex.: embeds complexos). */
  wrapFormPanel?: boolean;
};

/**
 * Layout das ferramentas de material IA — apenas formulário.
 * Após gerar, o conteúdo abre no editor (sem painel de prévia).
 */
export function MaterialToolPageShell({
  tool,
  studioMode = false,
  onBack,
  backLabel = "Voltar",
  form,
  formScrollAttr = false,
  fullWidth = false,
  wrapFormPanel = true,
}: MaterialToolPageShellProps) {
  void fullWidth;

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

      <div className={`min-h-0 flex-1 ${studioMode ? "min-h-0" : "min-h-0 lg:min-h-[680px]"}`}>
        <div
          {...(formScrollAttr ? { "data-planify-scroll": "" } : {})}
          className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain p-3 sm:p-4 lg:p-5"
        >
          <div className="max-lg:pb-[max(5.5rem,env(safe-area-inset-bottom))]">
            {wrapFormPanel ? (
              <div className={HUD_FORM_PANEL_CLASS}>{form}</div>
            ) : (
              form
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
