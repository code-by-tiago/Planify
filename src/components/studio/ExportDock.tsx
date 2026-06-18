"use client";

import type { ReactNode } from "react";

type ExportDockProps = {
  visible?: boolean;
  disabled?: boolean;
  statusMessage?: string | null;
  children: ReactNode;
  className?: string;
};

/**
 * Barra fixa inferior de exportação — padrão studio (Teachy+).
 */
export function ExportDock({
  visible = true,
  disabled = false,
  statusMessage = null,
  children,
  className = "",
}: ExportDockProps) {
  if (!visible) return null;

  return (
    <div
      className={`planify-studio-export-dock shrink-0 border-t border-cyan-400/15 bg-white/95 px-3 py-3 backdrop-blur-md sm:px-5 ${className}`}
      aria-label="Exportar material"
    >
      {statusMessage ? (
        <p className="mb-2 text-center text-[11px] font-semibold text-slate-600 sm:text-left">
          {statusMessage}
        </p>
      ) : null}
      <div
        className={`flex flex-wrap items-center justify-center gap-2 sm:justify-end ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default ExportDock;
