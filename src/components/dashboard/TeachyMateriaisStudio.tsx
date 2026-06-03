"use client";

import { useState } from "react";
import { MateriaisClient } from "@/app/materiais/MateriaisClient";
import { TeachyToolToolbar } from "@/components/dashboard/TeachyToolToolbar";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";

const TEMA_KEY = "planify-studio-tema";

type TeachyMateriaisStudioProps = {
  toolId: PlanifyToolId;
  temaFromUrl?: string;
  onClose: () => void;
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
}: TeachyMateriaisStudioProps) {
  const [initialTema] = useState(
    () => temaFromUrl.trim() || readStoredTema(),
  );

  function handleHint(snippet: string) {
    window.dispatchEvent(
      new CustomEvent("planify-objetivo-hint", { detail: snippet }),
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white">
      <TeachyToolToolbar onApplyHint={handleHint} />
      <div className="min-h-0 flex-1 overflow-hidden">
        <MateriaisClient
          key={`${toolId}-${initialTema}`}
          studioMode
          initialTipo={toolId}
          initialTema={initialTema}
          onStudioClose={onClose}
        />
      </div>
    </div>
  );
}
