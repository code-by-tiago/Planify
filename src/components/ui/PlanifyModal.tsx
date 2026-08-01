"use client";

import { useEffect, type ReactNode } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";

type PlanifyModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Largura máxima do painel. Padrão: "max-w-2xl" */
  maxWidth?: string;
  /** Mostrar botão de fechar no header */
  showClose?: boolean;
};

/**
 * Modal de overlay com painel centralizado.
 * Fecha ao clicar no overlay ou pressionar Escape.
 */
export function PlanifyModal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
  showClose = true,
}: PlanifyModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Painel */}
      <div
        className={[
          "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl",
          maxWidth,
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "planify-modal-title" : undefined}
      >
        {(title || showClose) && (
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
            <div>
              {title && (
                <h2
                  id="planify-modal-title"
                  className="text-lg font-black tracking-tight text-slate-950"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-0.5 text-sm font-semibold text-slate-500">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
              >
                <PlanifyIcon name="close" className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal footer helper
// ---------------------------------------------------------------------------

type ModalFooterProps = {
  children: ReactNode;
};

export function PlanifyModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
      {children}
    </div>
  );
}
