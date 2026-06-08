"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { CommunityFriendSummary, CommunityPendingFriend } from "@/lib/community/types";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export function CommunityFriendsPanel() {
  const [friends, setFriends] = useState<CommunityFriendSummary[]>([]);
  const [incoming, setIncoming] = useState<CommunityPendingFriend[]>([]);
  const [outgoing, setOutgoing] = useState<CommunityPendingFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/community/friends?view=all", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        friends?: CommunityFriendSummary[];
        incoming?: CommunityPendingFriend[];
        outgoing?: CommunityPendingFriend[];
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar amigos.");
      }

      setFriends(data?.friends || []);
      setIncoming(data?.incoming || []);
      setOutgoing(data?.outgoing || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar amigos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAction(userId: string, action: "accept" | "decline" | "cancel") {
    setBusyId(userId);
    setError("");

    try {
      const response = await fetch(`/api/community/friends/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await parseJsonResponse<{ error?: { message?: string } }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível atualizar solicitação.");
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar amizade.");
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = incoming.length;

  return (
    <section className="rounded-2xl border border-cyan-400/15 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <PlanifyIcon name="user" className="h-4 w-4 text-cyan-600" />
          <span className="text-sm font-extrabold text-slate-950">Amigos e solicitações</span>
          {pendingCount > 0 ? (
            <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          ) : null}
        </div>
        <PlanifyIcon
          name="chevronDown"
          className={`h-4 w-4 text-slate-400 transition ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-cyan-400/10 px-4 py-4">
          {loading ? (
            <p className="text-sm font-semibold text-slate-500">Carregando…</p>
          ) : (
            <>
              {incoming.length > 0 ? (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-cyan-700">
                    Pedidos recebidos
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {incoming.map((item) => (
                      <li
                        key={item.friendshipId}
                        className="flex items-center gap-3 rounded-xl border border-cyan-400/15 bg-cyan-50/30 px-3 py-2"
                      >
                        <CommunityAuthorAvatar
                          userId={item.userId}
                          name={item.displayName}
                          avatarUrl={item.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <CommunityAuthorLink userId={item.userId} name={item.displayName} />
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={busyId === item.userId}
                            onClick={() => void handleAction(item.userId, "accept")}
                            className="rounded-lg bg-cyan-600 px-2 py-1 text-[10px] font-bold text-white"
                          >
                            Aceitar
                          </button>
                          <button
                            type="button"
                            disabled={busyId === item.userId}
                            onClick={() => void handleAction(item.userId, "decline")}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600"
                          >
                            Recusar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {outgoing.length > 0 ? (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Aguardando resposta
                  </h4>
                  <ul className="mt-2 space-y-2">
                    {outgoing.map((item) => (
                      <li
                        key={item.friendshipId}
                        className="flex items-center gap-3 rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2"
                      >
                        <CommunityAuthorAvatar
                          userId={item.userId}
                          name={item.displayName}
                          avatarUrl={item.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <CommunityAuthorLink userId={item.userId} name={item.displayName} />
                        </div>
                        <button
                          type="button"
                          disabled={busyId === item.userId}
                          onClick={() => void handleAction(item.userId, "cancel")}
                          className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-[10px] font-bold text-amber-800"
                        >
                          Cancelar
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div>
                <h4 className="text-xs font-black uppercase tracking-wide text-emerald-700">
                  Amigos ({friends.length})
                </h4>
                {friends.length === 0 ? (
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    Nenhum amigo ainda. Busque professores na Comunidade.
                  </p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {friends.map((friend) => (
                      <li key={friend.friendshipId}>
                        <Link
                          href={`/marketplace/perfil/${friend.userId}`}
                          className="flex items-center gap-3 rounded-xl border border-cyan-400/15 px-3 py-2 transition hover:bg-cyan-50/40"
                        >
                          <CommunityAuthorAvatar
                            userId={friend.userId}
                            name={friend.displayName}
                            avatarUrl={friend.avatarUrl}
                            size="sm"
                          />
                          <span className="text-sm font-extrabold text-slate-950">
                            {friend.displayName}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}

          {error ? (
            <p className="text-xs font-semibold text-rose-700">{error}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
