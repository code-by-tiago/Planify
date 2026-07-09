"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { PlanifyWorkspaceProvider } from "@/components/pro/planify-workspace-context";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

const TEMA_KEY = "planify-studio-tema";

const MateriaisClient = dynamic(
  () =>
    import("@/app/materiais/MateriaisClient").then((m) => m.MateriaisClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[200px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
          <p className="text-sm font-semibold text-cyan-700">Carregando ferramenta…</p>
        </div>
      </div>
    ),
  },
);

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
