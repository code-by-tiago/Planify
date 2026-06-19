"use client";

import { useEffect, useState, type ReactNode } from "react";

type MobilePanel = "config" | "preview";

export type StudioSectionFrameProps = {
  /** Conteúdo em coluna única (wizard, listas longas). */
  children?: ReactNode;
  /** Painel esquerdo — filtros, formulário. */
  config?: ReactNode;
  /** Painel direito — resultados, prévia, detalhe. */
  preview?: ReactNode;
  singleColumn?: boolean;
  exportDock?: ReactNode;
  /** Barra de ação sticky (gerar, buscar). */
  stickyBar?: ReactNode;
  className?: string;
};

/**
 * Frame studio para seções do dashboard — split config|preview ou coluna única.
 */
export function StudioSectionFrame({
  children,
  config,
  preview,
  singleColumn = false,
  exportDock,
  stickyBar,
  className = "",
}: StudioSectionFrameProps) {
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
        className={`planify-studio-pro ps-pro-shell flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
      >
        <div className="ps-pro-config relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {stickyBar ? (
            <div className="ps-pro-generate-bar sticky top-0 z-10">{stickyBar}</div>
          ) : null}
          <div className="p-4 sm:p-5">{children ?? config}</div>
        </div>
        {exportDock}
      </div>
    );
  }

  return (
    <div
      className={`planify-studio-pro ps-pro-shell flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
    >
      <div
        className="flex shrink-0 gap-2 border-b border-cyan-400/10 bg-white/90 px-3 py-2 lg:hidden"
        role="tablist"
        aria-label="Painel da seção"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobilePanel === "config"}
          onClick={() => setMobilePanel("config")}
          className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
            mobilePanel === "config" ? "ps-pro-chip ps-pro-chip--active" : "ps-pro-chip"
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
          Resultado
        </button>
      </div>

      <div className="grid min-h-0 flex-1 max-lg:grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <div
          className={`ps-pro-config min-h-0 overflow-y-auto overscroll-contain lg:border-r ${
            mobilePanel === "config" ? "max-lg:flex max-lg:flex-1 max-lg:flex-col" : "max-lg:hidden"
          }`}
        >
          {stickyBar ? (
            <div className="ps-pro-generate-bar sticky top-0 z-10">{stickyBar}</div>
          ) : null}
          <div className="p-4 sm:p-5">{config}</div>
        </div>
        <div
          className={`ps-pro-preview min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 ${
            mobilePanel === "preview" ? "max-lg:flex max-lg:flex-1 max-lg:flex-col" : "max-lg:hidden"
          }`}
        >
          <div className="ps-pro-preview-glass min-h-[min(40vh,240px)] flex-1 rounded-2xl p-3 sm:p-5">
            {preview}
          </div>
        </div>
      </div>

      {exportDock}
    </div>
  );
}

export default StudioSectionFrame;
