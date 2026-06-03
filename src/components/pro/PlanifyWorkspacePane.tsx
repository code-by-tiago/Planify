import type { ReactNode } from "react";

type PlanifyWorkspacePaneProps = {
  children: ReactNode;
  className?: string;
  /** Conteúdo fixo no topo (hero); o restante rola no painel */
  header?: ReactNode;
};

/**
 * Painel principal do app-shell: ocupa o quadrante direito sem estourar a viewport.
 * Scroll apenas na área de conteúdo (ou no header+body quando não há header).
 */
export function PlanifyWorkspacePane({
  children,
  className = "",
  header,
}: PlanifyWorkspacePaneProps) {
  if (header) {
    return (
      <div
        className={`planify-ui3 flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
      >
        <div className="shrink-0">{header}</div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`planify-ui3 flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </div>
    </div>
  );
}
