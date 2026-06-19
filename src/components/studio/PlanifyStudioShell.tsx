"use client";

import { useEffect, useState, type ReactNode } from "react";
import { StudioToolHeader, type StudioToolHeaderProps } from "@/components/studio/StudioToolHeader";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";

type MobilePanel = "form" | "preview";

export type PlanifyStudioShellProps = {
  icon?: PlanifyIconName;
  iconAccent?: string;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumb?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  headerActions?: ReactNode;
  form: ReactNode;
  preview?: ReactNode;
  exportDock?: ReactNode;
  /** Tabbed mobile panels when preview exists (default true). */
  mobileTabs?: boolean;
  singleColumn?: boolean;
  previewReady?: boolean;
  previewLoading?: boolean;
  formScrollAttr?: boolean;
  previewScrollAttr?: boolean;
  showHeader?: boolean;
  className?: string;
};

/**
 * Shell studio genérico — config | preview, export dock, header sempre visível.
 */
export function PlanifyStudioShell({
  icon,
  iconAccent,
  title,
  subtitle,
  eyebrow,
  breadcrumb,
  onBack,
  backLabel = "Voltar",
  headerActions,
  form,
  preview,
  exportDock,
  mobileTabs = true,
  singleColumn = false,
  previewReady = false,
  previewLoading = false,
  formScrollAttr = false,
  previewScrollAttr = false,
  showHeader = true,
  className = "",
}: PlanifyStudioShellProps) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("form");
  const hasPreview = Boolean(preview) && !singleColumn;
  const useTabs = hasPreview && mobileTabs;

  useEffect(() => {
    if (previewReady || previewLoading) {
      setMobilePanel("preview");
    }
  }, [previewReady, previewLoading]);

  const headerProps: StudioToolHeaderProps = {
    icon,
    iconAccent,
    eyebrow,
    title,
    subtitle,
    breadcrumb,
    onBack,
    backLabel,
    actions: headerActions,
  };

  return (
    <div
      className={`planify-studio-pro ps-pro-shell flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
    >
      {showHeader ? <StudioToolHeader {...headerProps} /> : null}

      {useTabs ? (
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
              mobilePanel === "form" ? "ps-pro-chip ps-pro-chip--active" : "ps-pro-chip"
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
              mobilePanel === "preview" ? "ps-pro-chip ps-pro-chip--active" : "ps-pro-chip"
            }`}
          >
            {previewLoading ? "Gerando…" : previewReady ? "Resultado" : "Prévia"}
          </button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-hidden">
        {singleColumn || !hasPreview ? (
          <div
            {...(formScrollAttr ? { "data-planify-scroll": "" } : {})}
            className="ps-pro-config h-full min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5"
          >
            <div className="max-lg:pb-[max(5.5rem,env(safe-area-inset-bottom))]">{form}</div>
          </div>
        ) : (
          <div className="grid h-full min-h-0 max-lg:grid-cols-1 lg:grid-cols-[0.88fr_1.12fr]">
            <div
              {...(formScrollAttr ? { "data-planify-scroll": "" } : {})}
              className={`ps-pro-config min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 lg:border-r lg:max-h-none ${
                mobilePanel === "form"
                  ? "max-lg:flex max-lg:flex-1 max-lg:flex-col"
                  : "max-lg:hidden"
              }`}
            >
              <div className="max-lg:pb-[max(5.5rem,env(safe-area-inset-bottom))]">{form}</div>
            </div>
            <div
              {...(previewScrollAttr ? { "data-planify-scroll": "" } : {})}
              className={`ps-pro-preview min-h-0 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5 ${
                mobilePanel === "preview"
                  ? "max-lg:flex max-lg:flex-1 max-lg:flex-col"
                  : "max-lg:hidden"
              }`}
            >
              <div className="ps-pro-preview-glass min-h-[min(50vh,280px)] flex-1 rounded-2xl p-3 sm:min-h-[280px] sm:p-5">
                {preview}
              </div>
            </div>
          </div>
        )}
      </div>

      {exportDock}
    </div>
  );
}

export default PlanifyStudioShell;
