"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { FriendshipStatus } from "@/lib/community/types";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useCallback, useEffect, useState } from "react";

type CommunityFriendButtonProps = {
  targetUserId: string;
  isOwnProfile?: boolean;
  onMessage?: (userId: string) => void;
  onStatusChange?: (status: FriendshipStatus) => void;
};

export function CommunityFriendButton({
  targetUserId,
  isOwnProfile,
  onMessage,
  onStatusChange,
}: CommunityFriendButtonProps) {
  const [status, setStatus] = useState<FriendshipStatus>("none");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    if (isOwnProfile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/community/friends/${targetUserId}`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        status?: FriendshipStatus;
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar amizade.");
      }

      const next = data?.status || "none";
      setStatus(next);
      onStatusChange?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar amizade.");
    } finally {
      setLoading(false);
    }
  }, [isOwnProfile, onStatusChange, targetUserId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function runAction(action: "request" | "accept" | "decline" | "cancel") {
    setBusy(true);
    setError("");

    try {
      let response: Response;

      if (action === "request") {
        response = await fetch("/api/community/friends", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: targetUserId }),
        });
      } else {
        response = await fetch(`/api/community/friends/${targetUserId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      }

      const data = await parseJsonResponse<{
        status?: FriendshipStatus;
        friendship?: { status?: FriendshipStatus };
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível atualizar amizade.");
      }

      const next =
        data?.status || data?.friendship?.status || (action === "cancel" ? "none" : status);
      setStatus(next);
      onStatusChange?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar amizade.");
    } finally {
      setBusy(false);
    }
  }

  if (isOwnProfile) {
    return null;
  }

  if (loading) {
    return (
      <span className="inline-flex items-center rounded-xl border border-cyan-400/20 bg-white/80 px-3 py-2 text-xs font-bold text-slate-500">
        Carregando…
      </span>
    );
  }

  const btnBase =
    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "none" || status === "declined" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void runAction("request")}
          className={`${btnBase} bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm hover:brightness-105`}
        >
          <PlanifyIcon name="plus" className="h-3.5 w-3.5" />
          Adicionar amigo
        </button>
      ) : null}

      {status === "pending_outgoing" ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void runAction("cancel")}
          className={`${btnBase} border border-amber-200 bg-amber-50 text-amber-800`}
        >
          Solicitação pendente
        </button>
      ) : null}

      {status === "pending_incoming" ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAction("accept")}
            className={`${btnBase} bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm hover:brightness-105`}
          >
            Aceitar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void runAction("decline")}
            className={`${btnBase} border border-slate-200 bg-white text-slate-700`}
          >
            Recusar
          </button>
        </>
      ) : null}

      {status === "accepted" ? (
        <>
          <span
            className={`${btnBase} border border-emerald-200 bg-emerald-50 text-emerald-800`}
          >
            <PlanifyIcon name="checkCircle" className="h-3.5 w-3.5" />
            Amigos
          </span>
          {onMessage ? (
            <button
              type="button"
              onClick={() => onMessage(targetUserId)}
              className={`${btnBase} border border-cyan-400/25 bg-white text-cyan-800 hover:bg-cyan-50`}
            >
              <PlanifyIcon name="message" className="h-3.5 w-3.5" />
              Mensagem
            </button>
          ) : null}
        </>
      ) : null}

      {status === "blocked" ? (
        <span className={`${btnBase} border border-slate-200 bg-slate-50 text-slate-500`}>
          Indisponível
        </span>
      ) : null}

      {error ? (
        <p className="w-full text-xs font-semibold text-rose-700">{error}</p>
      ) : null}
    </div>
  );
}
