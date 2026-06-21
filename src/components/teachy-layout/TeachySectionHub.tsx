"use client";

import { useEffect, useState, type ReactNode } from "react";

type MobilePanel = "config" | "preview";

export type TeachySectionHubProps = {
  children?: ReactNode;
  config?: ReactNode;
  preview?: ReactNode;
  singleColumn?: boolean;
  exportDock?: ReactNode;
  stickyBar?: ReactNode;
  className?: string;
};

/**
 * Section hub — split config|preview or single column.
 * Evolves StudioSectionFrame with pf-* premium scope.
 */
export function TeachySectionHub({
  children,
  config,
  preview,
  singleColumn = false,
  exportDock,
  stickyBar,
  className = "",
}: TeachySectionHubProps) {
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("config");
  const splitMode = Boolean(config && preview) && !singleColumn;

  useEffect(() => {
    if (splitMode && preview) {
      setMobilePanel("preview");
    }
  }, [splitMode, preview]);

  if (!splitMode) {
    return (
      <div
        className={`pf-scope pf-studio-shell planify-studio-pro ps-pro-shell flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
      >
        <div className="pf-studio-config ps-pro-config relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {stickyBar ? (
            <div className="ps-pro-generate-bar sticky top-0 z-10">{stickyBar}</div>
          ) : null}
          <div className="p-4 sm:p-5">{children ?? config}</div>
        </div>
        {exportDock ? <div className="pf-export-dock">{exportDock}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={`pf-scope pf-studio-shell planify-studio-pro ps-pro-shell flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
    >
      <div className="pf-mobile-tabs" role="tablist" aria-label="Painel da seção">
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === "config"}
          onClick={() => setMobilePanel("config")}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
            mobilePanel === "config" ? "ps-pro-chip ps-pro-chip--active pf-chip--active" : "ps-pro-chip pf-chip"
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
            mobilePanel === "preview" ? "ps-pro-chip ps-pro-chip--active pf-chip--active" : "ps-pro-chip pf-chip"
          }`}
        >
          Resultado
        </button>
      </div>

      <div className="grid min-h-0 flex-1 max-lg:grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <div
          className={`pf-studio-config ps-pro-config min-h-0 overflow-y-auto overscroll-contain lg:border-r ${
            mobilePanel === "config" ? "max-lg:flex max-lg:flex-1 max-lg:flex-col" : "max-lg:hidden"
          }`}
        >
          {stickyBar ? (
            <div className="ps-pro-generate-bar sticky top-0 z-10">{stickyBar}</div>
          ) : null}
          <div className="p-4 sm:p-5">{config}</div>
        </div>
        <div
          className={`pf-studio-preview ps-pro-preview min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 ${
            mobilePanel === "preview" ? "max-lg:flex max-lg:flex-1 max-lg:flex-col" : "max-lg:hidden"
          }`}
        >
          <div className="pf-studio-preview-glass ps-pro-preview-glass min-h-[min(40vh,240px)] flex-1 rounded-2xl p-3 sm:p-5">
            {preview}
          </div>
        </div>
      </div>

      {exportDock ? <div className="pf-export-dock">{exportDock}</div> : null}
    </div>
  );
}

export default TeachySectionHub;
