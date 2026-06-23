"use client";

import { useState } from "react";
import { MateriaisClient } from "@/app/materiais/MateriaisClient";
import { PlanifyWorkspaceProvider } from "@/components/pro/planify-workspace-context";
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

  function handleOpenRelatedTool(nextToolId: PlanifyToolId) {
    if (onSelectTool) {
      onSelectTool(nextToolId);
      return;
    }
    onClose();
  }

  return (
    <PlanifyWorkspaceProvider embeddedInDashboard>
      <div className="planify-hud planify-materiais-studio flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--planify-canvas)]">
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
