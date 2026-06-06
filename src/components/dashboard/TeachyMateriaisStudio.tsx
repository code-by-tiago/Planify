"use client";

import { useRef, useState } from "react";
import { MateriaisClient } from "@/app/materiais/MateriaisClient";
import { TeachyToolToolbar } from "@/components/dashboard/TeachyToolToolbar";
import { PlanifyPageHero } from "@/components/pro/PlanifyPageHero";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  PlanifyHeroCollapseProvider,
  PlanifyWorkspaceProvider,
} from "@/components/pro/planify-workspace-context";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";
import { getPlanifyTool, type PlanifyToolId } from "@/lib/pro/planifyTools";

const TEMA_KEY = "planify-studio-tema";

type TeachyMateriaisStudioProps = {
  toolId: PlanifyToolId;
  temaFromUrl?: string;
  onClose: () => void;
  onSelectTool?: (toolId: PlanifyToolId) => void;
};

function readStoredTema(): string {
  if (typeof window === "undefined") return "";
  try {
    const saved = sessionStorage.getItem(TEMA_KEY) || "";
    if (saved) sessionStorage.removeItem(TEMA_KEY);
    return saved;
  } catch {
    return "";
  }
}

export function TeachyMateriaisStudio({
  toolId,
  temaFromUrl = "",
  onClose,
  onSelectTool,
}: TeachyMateriaisStudioProps) {
  const [initialTema] = useState(
    () => temaFromUrl.trim() || readStoredTema(),
  );
  const tool = getPlanifyTool(toolId);

  function handleHint(snippet: string, _actionId: string) {
    window.dispatchEvent(
      new CustomEvent("planify-objetivo-hint", { detail: snippet }),
    );
  }

  function handleOpenRelatedTool(nextToolId: PlanifyToolId) {
    if (onSelectTool) {
      onSelectTool(nextToolId);
      return;
    }
    onClose();
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const toolbarCollapsed = useScrollCollapse(scrollRef, 24);

  return (
    <PlanifyWorkspaceProvider embeddedInDashboard>
      <div
        ref={scrollRef}
        className="planify-hud planify-materiais-studio flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--planify-canvas)]"
      >
        <PlanifyHeroCollapseProvider collapsed={toolbarCollapsed}>
          <div className="sticky top-0 z-20 shrink-0 border-b border-cyan-400/15 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
            <PlanifyPageHero
              badge={tool.shortTitle}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              action={
                <button
                  type="button"
                  onClick={onClose}
                  className="pl-hud-btn-secondary flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
                >
                  <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
                  Início
                </button>
              }
            />
            <TeachyToolToolbar
              collapsed={toolbarCollapsed}
              onApplyHint={handleHint}
            />
          </div>
        </PlanifyHeroCollapseProvider>
        <div className="min-h-0 flex-1 overflow-hidden">
          <MateriaisClient
            key={`${toolId}-${initialTema}`}
            studioMode
            initialTipo={toolId}
            initialTema={initialTema}
            onStudioClose={onClose}
            onOpenRelatedTool={handleOpenRelatedTool}
          />
        </div>
      </div>
    </PlanifyWorkspaceProvider>
  );
}
