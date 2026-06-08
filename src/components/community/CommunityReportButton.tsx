"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useState } from "react";

type CommunityReportButtonProps = {
  targetType: "material" | "comment" | "user";
  targetId: string;
  compact?: boolean;
};

export function CommunityReportButton({
  targetType,
  targetId,
  compact,
}: CommunityReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function submit() {
    setBusy(true);
    setStatus("");

    try {
      const response = await fetch("/api/community/reports", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason }),
      });
      const data = await parseJsonResponse<{ error?: { message?: string } }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível enviar denúncia.");
      }

      setStatus("Denúncia registrada. Obrigado.");
      setReason("");
      window.setTimeout(() => setOpen(false), 1200);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Erro ao denunciar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          compact
            ? "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-400 transition hover:text-rose-600"
            : "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-500 transition hover:border-rose-200 hover:text-rose-700"
        }
        title="Denunciar"
      >
        <PlanifyIcon name="alertCircle" className="h-3.5 w-3.5" />
        {!compact ? "Denunciar" : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-950">Denunciar conteúdo</h3>
            <p className="mt-1 text-sm text-slate-600">
              Descreva brevemente o problema. A equipe Planify analisará o caso.
            </p>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Ex.: conteúdo ofensivo, direitos autorais…"
              className="mt-3 w-full rounded-xl border border-cyan-400/20 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            {status ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700">{status}</p>
            ) : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={busy || reason.trim().length < 3}
                onClick={() => void submit()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {busy ? "Enviando…" : "Enviar denúncia"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
