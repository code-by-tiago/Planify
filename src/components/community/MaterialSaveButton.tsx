"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useState } from "react";

type MaterialSaveButtonProps = {
  materialId: string;
  initialSaved?: boolean;
  onChange?: (saved: boolean) => void;
};

export function MaterialSaveButton({
  materialId,
  initialSaved = false,
  onChange,
}: MaterialSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);

    try {
      const response = await fetch(
        saved
          ? `/api/community/saved-materials?materialId=${materialId}`
          : "/api/community/saved-materials",
        {
          method: saved ? "DELETE" : "POST",
          credentials: "include",
          headers: saved ? undefined : { "Content-Type": "application/json" },
          body: saved ? undefined : JSON.stringify({ materialId }),
        },
      );
      const data = await parseJsonResponse<{ error?: { message?: string } }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível atualizar biblioteca.");
      }

      const next = !saved;
      setSaved(next);
      onChange?.(next);
    } catch {
      // silencioso
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void toggle()}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition disabled:opacity-60 ${
        saved
          ? "border-amber-300 bg-amber-50 text-amber-800"
          : "border-cyan-400/20 bg-white/80 text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/60"
      }`}
      title={saved ? "Remover da biblioteca" : "Salvar na biblioteca"}
    >
      <PlanifyIcon name="library" className="h-3.5 w-3.5" />
      {saved ? "Salvo" : "Salvar"}
    </button>
  );
}
