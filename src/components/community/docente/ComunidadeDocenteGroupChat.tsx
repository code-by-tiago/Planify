"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { getCurrentAccessToken } from "@/lib/auth/session-client";
import { formatDocenteTimeAgo } from "@/lib/community/docente-utils";
import type { CommunityGroupMessage } from "@/server/community/community-group-messages-service";

type ComunidadeDocenteGroupChatProps = {
  groupId: string;
  enabled: boolean;
  viewerName?: string;
};

export function ComunidadeDocenteGroupChat({
  groupId,
  enabled,
  viewerName = "Você",
}: ComunidadeDocenteGroupChatProps) {
  const [messages, setMessages] = useState<CommunityGroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const viewerIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, []);

  const loadMessages = useCallback(async () => {
    if (!enabled) return;

    try {
      const response = await fetch(`/api/community/docente/grupo/${groupId}/messages`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar o chat.");
      }
      setMessages(data.messages || []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar chat.");
    } finally {
      setLoading(false);
    }
  }, [enabled, groupId]);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void loadMessages();
  }, [enabled, loadMessages]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let pollTimer: number | null = null;
    let channel: ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null = null;

    async function setupRealtime() {
      try {
        const supabase = getSupabaseBrowserClient();
        const token = await getCurrentAccessToken();
        if (!token) throw new Error("no_session");

        const { data: userData } = await supabase.auth.getUser(token);
        viewerIdRef.current = userData.user?.id || null;

        channel = supabase
          .channel(`community-group-chat-${groupId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "community_group_messages",
              filter: `group_id=eq.${groupId}`,
            },
            (payload) => {
              const row = payload.new as {
                id: string;
                group_id: string;
                sender_id: string;
                body: string;
                created_at: string;
                edited_at: string | null;
                deleted_at: string | null;
              };
              if (!row?.id || row.deleted_at || cancelled) return;

              setMessages((current) => {
                if (current.some((message) => message.id === row.id)) return current;
                const isOwn = row.sender_id === viewerIdRef.current;
                return [
                  ...current,
                  {
                    id: row.id,
                    groupId: row.group_id,
                    senderId: row.sender_id,
                    senderName: isOwn ? viewerName : "Professor(a)",
                    senderAvatarUrl: null,
                    body: row.body,
                    createdAt: row.created_at,
                    editedAt: row.edited_at,
                    isOwn,
                    canEdit: isOwn,
                    canDelete: isOwn,
                  },
                ];
              });
              void loadMessages();
            },
          )
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "community_group_messages",
              filter: `group_id=eq.${groupId}`,
            },
            (payload) => {
              const row = payload.new as {
                id: string;
                body: string;
                edited_at: string | null;
                deleted_at: string | null;
              };
              if (!row?.id || cancelled) return;

              if (row.deleted_at) {
                setMessages((current) => current.filter((message) => message.id !== row.id));
                return;
              }

              setMessages((current) =>
                current.map((message) =>
                  message.id === row.id
                    ? { ...message, body: row.body, editedAt: row.edited_at }
                    : message,
                ),
              );
            },
          )
          .subscribe();
      } catch {
        pollTimer = window.setInterval(() => {
          void loadMessages();
        }, 12_000);
      }
    }

    void setupRealtime();

    return () => {
      cancelled = true;
      if (pollTimer) window.clearInterval(pollTimer);
      if (channel) void channel.unsubscribe();
    };
  }, [enabled, groupId, loadMessages, viewerName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(`/api/community/docente/grupo/${groupId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível enviar.");
      }
      setDraft("");
      if (data.message) {
        setMessages((current) => {
          if (current.some((message) => message.id === data.message.id)) return current;
          return [...current, data.message as CommunityGroupMessage];
        });
      } else {
        await loadMessages();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const handleSaveEdit = async (messageId: string) => {
    const body = editDraft.trim();
    if (!body) return;

    setSending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/community/docente/grupo/${groupId}/messages/${messageId}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível editar.");
      }
      setEditingId(null);
      setEditDraft("");
      if (data.message) {
        setMessages((current) =>
          current.map((message) =>
            message.id === messageId ? (data.message as CommunityGroupMessage) : message,
          ),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar mensagem.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm("Remover esta mensagem do chat?")) return;

    setSending(true);
    setError("");
    try {
      const response = await fetch(
        `/api/community/docente/grupo/${groupId}/messages/${messageId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Não foi possível remover.");
      }
      setMessages((current) => current.filter((message) => message.id !== messageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover mensagem.");
    } finally {
      setSending(false);
    }
  };

  if (!enabled) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
        <p className="text-sm text-slate-500">
          Entre no grupo para participar do chat com os membros.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white">
      <div ref={listRef} className="max-h-[50dvh] min-h-[200px] space-y-3 overflow-y-auto p-4 sm:max-h-[420px] sm:min-h-[240px]">
        {loading ? (
          <div className="flex h-full min-h-[180px] items-center justify-center">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            Nenhuma mensagem ainda. Dê as boas-vindas ao grupo!
          </p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={[
                "flex gap-2",
                message.isOwn ? "flex-row-reverse text-right" : "flex-row",
              ].join(" ")}
            >
              <CommunityAuthorAvatar
                userId={message.senderId}
                name={message.senderName}
                avatarUrl={message.senderAvatarUrl}
                size="sm"
              />
              <div className="min-w-0 max-w-[82%]">
                {editingId === message.id ? (
                  <div className="space-y-2 rounded-2xl border border-cyan-200 bg-cyan-50/40 p-3">
                    <textarea
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditDraft("");
                        }}
                        className="min-h-11 rounded-lg px-3 py-2 text-xs font-bold text-slate-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={sending || editDraft.trim().length === 0}
                        onClick={() => void handleSaveEdit(message.id)}
                        className="min-h-11 rounded-lg bg-[#0F172A] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={[
                      "rounded-2xl px-3 py-2 text-sm",
                      message.isOwn
                        ? "bg-cyan-500 text-white"
                        : "border border-slate-100 bg-slate-50 text-slate-700",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-bold opacity-80">
                        {message.isOwn ? viewerName : message.senderName}
                      </p>
                      {(message.canEdit || message.canDelete) && (
                        <div className="flex gap-1">
                          {message.canEdit ? (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(message.id);
                                setEditDraft(message.body);
                              }}
                              className="min-h-8 rounded-md px-2 py-1 text-[10px] font-bold opacity-80 hover:opacity-100"
                            >
                              Editar
                            </button>
                          ) : null}
                          {message.canDelete ? (
                            <button
                              type="button"
                              onClick={() => void handleDelete(message.id)}
                              className="min-h-8 rounded-md px-2 py-1 text-[10px] font-bold opacity-80 hover:opacity-100"
                            >
                              Excluir
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-left">{message.body}</p>
                    <p className="mt-1 text-left text-[10px] opacity-70">
                      {formatDocenteTimeAgo(message.createdAt)}
                      {message.editedAt ? " · editada" : ""}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex gap-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            placeholder="Escreva uma mensagem para o grupo…"
            className="min-h-11 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-cyan-400"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <button
            type="button"
            disabled={sending || draft.trim().length === 0}
            onClick={() => void handleSend()}
            className="min-h-11 self-end rounded-xl bg-[#0F172A] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {sending ? "…" : "Enviar"}
          </button>
        </div>
        {error ? (
          <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
