"use client";

import { useRef, type ReactNode } from "react";
import {
  PlanifyHeroCollapseProvider,
  usePlanifyWorkspace,
} from "@/components/pro/planify-workspace-context";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";

type PlanifyWorkspacePaneProps = {
  children: ReactNode;
  className?: string;
  /** Conteúdo no topo; no dashboard fica oculto (título já está no shell) */
  header?: ReactNode;
};

/**
 * Painel principal do app-shell: ocupa o quadrante direito sem estourar a viewport.
 * Com header: rola tudo junto; o hero fica sticky e encolhe ao descer (fora do dashboard).
 */
export function PlanifyWorkspacePane({
  children,
  className = "",
  header,
}: PlanifyWorkspacePaneProps) {
  const { embeddedInDashboard } = usePlanifyWorkspace();
  const scrollRef = useRef<HTMLDivElement>(null);
  const showHeader = Boolean(header) && !embeddedInDashboard;
  const collapsed = useScrollCollapse(scrollRef, 36);

  const body = (
    <div className="mx-auto w-full max-w-7xl">{children}</div>
  );

  if (showHeader) {
    return (
      <div
        className={`planify-ui3 flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
      >
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <PlanifyHeroCollapseProvider collapsed={collapsed}>
            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
              {header}
            </div>
          </PlanifyHeroCollapseProvider>
          <div className="px-4 py-4 sm:px-6 sm:py-5">{body}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`planify-ui3 flex h-full min-h-0 w-full flex-col overflow-hidden ${className}`}
    >
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
      >
        {body}
      </div>
    </div>
  );
}
