"use client";

import { useRef, useState } from "react";
import { MateriaisClient } from "@/app/materiais/MateriaisClient";
import { TeachyToolToolbar } from "@/components/dashboard/TeachyToolToolbar";
import { PlanifyWorkspaceProvider } from "@/components/pro/planify-workspace-context";
import { useScrollCollapse } from "@/hooks/useScrollCollapse";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

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
        className="planify-materiais-studio flex h-full min-h-0 w-full flex-col overflow-hidden bg-white"
      >
        <TeachyToolToolbar
          collapsed={toolbarCollapsed}
          onApplyHint={handleHint}
        />
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
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
