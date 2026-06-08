"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useState } from "react";

type CommunityBlockButtonProps = {
  targetUserId: string;
  isOwnProfile?: boolean;
};

export function CommunityBlockButton({ targetUserId, isOwnProfile }: CommunityBlockButtonProps) {
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");

  if (isOwnProfile) {
    return null;
  }

  async function blockUser() {
    const confirmed = window.confirm(
      "Bloquear este professor? Vocês não poderão interagir na Comunidade.",
    );
    if (!confirmed) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(`/api/community/friends/${targetUserId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "block" }),
      });
      const data = await parseJsonResponse<{ error?: { message?: string } }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível bloquear usuário.");
      }

      setBlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao bloquear.");
    } finally {
      setBusy(false);
    }
  }

  if (blocked) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
        Usuário bloqueado
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void blockUser()}
        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-800 transition hover:bg-rose-100 disabled:opacity-60"
      >
        <PlanifyIcon name="lock" className="h-3.5 w-3.5" />
        {busy ? "Bloqueando…" : "Bloquear"}
      </button>
      {error ? <p className="mt-1 text-xs font-semibold text-rose-700">{error}</p> : null}
    </div>
  );
}
