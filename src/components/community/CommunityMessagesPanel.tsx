"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type {
  CommunityConversationSummary,
  CommunityMessage,
} from "@/lib/community/types";
import { getCurrentAccessToken } from "@/lib/auth/session-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type CommunityMessagesPanelProps = {
  open: boolean;
  onClose: () => void;
  initialUserId?: string | null;
  onUnreadChange?: (count: number) => void;
};

function formatTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CommunityMessagesPanel({
  open,
  onClose,
  initialUserId,
  onUnreadChange,
}: CommunityMessagesPanelProps) {
  const [conversations, setConversations] = useState<CommunityConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeOtherUserId, setActiveOtherUserId] = useState<string | null>(null);
  const [activeOtherUserName, setActiveOtherUserName] = useState("");
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialHandledRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  const loadViewerId = useCallback(async () => {
    try {
      const response = await fetch("/api/community/profile", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{ profile?: { userId?: string } }>(response);
      if (response.ok && data?.profile?.userId) {
        setViewerUserId(data.profile.userId);
      }
    } catch {
      // silencioso
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const response = await fetch("/api/community/messages/unread", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{ unreadCount?: number }>(response);
      if (response.ok) {
        onUnreadChange?.(data?.unreadCount || 0);
      }
    } catch {
      // silencioso
    }
  }, [onUnreadChange]);

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setError("");

    try {
      const response = await fetch("/api/community/messages/conversations", {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        conversations?: CommunityConversationSummary[];
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar conversas.");
      }

      setConversations(data?.conversations || []);
      void refreshUnread();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar conversas.");
    } finally {
      setLoadingList(false);
    }
  }, [refreshUnread]);

  const openThread = useCallback(
    async (conversationId: string, otherUserId: string, otherUserName: string) => {
      setActiveConversationId(conversationId);
      setActiveOtherUserId(otherUserId);
      setActiveOtherUserName(otherUserName);
      setLoadingThread(true);
      setError("");

      try {
        const response = await fetch(
          `/api/community/messages/conversations/${conversationId}`,
          {
            cache: "no-store",
            credentials: "include",
          },
        );
        const data = await parseJsonResponse<{
          messages?: CommunityMessage[];
          error?: { message?: string };
        }>(response);

        if (!response.ok) {
          throw new Error(data?.error?.message || "Não foi possível carregar mensagens.");
        }

        setMessages(data?.messages || []);
        void loadConversations();
        void refreshUnread();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar mensagens.");
      } finally {
        setLoadingThread(false);
      }
    },
    [loadConversations, refreshUnread],
  );

  const openWithUser = useCallback(
    async (userId: string) => {
      setError("");

      try {
        const response = await fetch("/api/community/messages/conversations", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        const data = await parseJsonResponse<{
          conversationId?: string;
          error?: { message?: string };
        }>(response);

        if (!response.ok || !data?.conversationId) {
          throw new Error(data?.error?.message || "Não foi possível abrir conversa.");
        }

        const listResponse = await fetch("/api/community/messages/conversations", {
          cache: "no-store",
          credentials: "include",
        });
        const listData = await parseJsonResponse<{
          conversations?: CommunityConversationSummary[];
        }>(listResponse);
        const nextConversations = listData?.conversations || [];
        setConversations(nextConversations);

        const match = nextConversations.find((item) => item.otherUserId === userId);
        await openThread(
          data.conversationId,
          userId,
          match?.otherUserName || "Professor",
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao abrir conversa.");
      }
    },
    [openThread],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadConversations();
    void loadViewerId();
  }, [loadConversations, loadViewerId, open]);

  useEffect(() => {
    if (!open || !initialUserId) {
      return;
    }

    if (initialHandledRef.current === initialUserId) {
      return;
    }

    initialHandledRef.current = initialUserId;
    void openWithUser(initialUserId);
  }, [initialUserId, open, openWithUser]);

  useEffect(() => {
    if (!open) {
      initialHandledRef.current = null;
      setActiveConversationId(null);
      setActiveOtherUserId(null);
      setMessages([]);
      setDraft("");
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingThread]);

  useEffect(() => {
    if (!open || !activeConversationId) {
      return;
    }

    let cancelled = false;
    let pollTimer: number | null = null;
    let channel: ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null = null;

    async function setupRealtime() {
      try {
        const supabase = getSupabaseBrowserClient();
        const token = await getCurrentAccessToken();

        if (!token) {
          throw new Error("no_session");
        }

        channel = supabase
          .channel(`community-messages-${activeConversationId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "community_messages",
              filter: `conversation_id=eq.${activeConversationId}`,
            },
            (payload) => {
              const row = payload.new as {
                id: string;
                conversation_id: string;
                sender_id: string;
                body: string;
                read_at: string | null;
                created_at: string;
              };

              if (!row?.id || cancelled) return;

              setMessages((current) => {
                if (current.some((message) => message.id === row.id)) {
                  return current;
                }

                return [
                  ...current,
                  {
                    id: row.id,
                    conversationId: row.conversation_id,
                    senderId: row.sender_id,
                    body: row.body,
                    readAt: row.read_at,
                    createdAt: row.created_at,
                  },
                ];
              });

              void refreshUnread();
              void loadConversations();
            },
          )
          .subscribe();
      } catch {
        pollTimer = window.setInterval(() => {
          if (document.visibilityState === "hidden") {
            return;
          }
          void openThread(
            activeConversationId!,
            activeOtherUserId || "",
            activeOtherUserName,
          );
        }, 8000);
      }
    }

    void setupRealtime();

    return () => {
      cancelled = true;
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      if (channel) {
        void getSupabaseBrowserClient().removeChannel(channel);
      }
    };
  }, [
    activeConversationId,
    activeOtherUserId,
    activeOtherUserName,
    loadConversations,
    open,
    openThread,
    refreshUnread,
  ]);

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();

    if (!activeConversationId || !draft.trim() || sending) {
      return;
    }

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `/api/community/messages/conversations/${activeConversationId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: draft }),
        },
      );
      const data = await parseJsonResponse<{
        message?: CommunityMessage;
        error?: { message?: string };
      }>(response);

      if (!response.ok || !data?.message) {
        throw new Error(data?.error?.message || "Não foi possível enviar mensagem.");
      }

      setMessages((current) => [...current, data.message!]);
      setDraft("");
      void loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Mensagens da comunidade"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Fechar mensagens"
      />
      <div className="relative z-10 flex h-[min(720px,92vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-cyan-400/20 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-cyan-400/15 bg-gradient-to-r from-cyan-50 to-indigo-50 px-4 py-3">
          <div className="flex items-center gap-2">
            {activeConversationId ? (
              <button
                type="button"
                onClick={() => {
                  setActiveConversationId(null);
                  setActiveOtherUserId(null);
                  setMessages([]);
                }}
                className="rounded-lg p-1.5 text-slate-600 hover:bg-white/80"
                aria-label="Voltar para conversas"
              >
                <PlanifyIcon name="arrowLeft" className="h-4 w-4" />
              </button>
            ) : null}
            <PlanifyIcon name="message" className="h-5 w-5 text-cyan-700" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-950">
                {activeConversationId ? activeOtherUserName : "Mensagens"}
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                {activeConversationId
                  ? "Conversa com amigo aceito"
                  : "Somente amigos podem conversar"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-white/80"
            aria-label="Fechar mensagens"
          >
            <PlanifyIcon name="close" className="h-4 w-4" />
          </button>
        </header>

        {error ? (
          <p className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-800">
            {error}
          </p>
        ) : null}

        {!activeConversationId ? (
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {loadingList ? (
              <p className="p-4 text-center text-sm font-semibold text-slate-500">
                Carregando conversas…
              </p>
            ) : conversations.length === 0 ? (
              <p className="rounded-xl border border-dashed border-cyan-400/25 bg-cyan-50/40 p-6 text-center text-sm font-medium text-slate-600">
                Nenhuma conversa ainda. Adicione amigos no perfil de outros professores e
                envie a primeira mensagem.
              </p>
            ) : (
              <ul className="space-y-2">
                {conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() =>
                        void openThread(
                          conversation.id,
                          conversation.otherUserId,
                          conversation.otherUserName,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl border border-cyan-400/15 bg-white px-3 py-3 text-left transition hover:border-cyan-400/35 hover:bg-cyan-50/40"
                    >
                      <CommunityAuthorAvatar
                        userId={conversation.otherUserId}
                        name={conversation.otherUserName}
                        avatarUrl={conversation.otherUserAvatarUrl}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-extrabold text-slate-950">
                            {conversation.otherUserName}
                          </span>
                          <span className="shrink-0 text-[10px] font-semibold text-slate-400">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                          {conversation.lastMessageBody || "Sem mensagens"}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 ? (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-600 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount > 9 ? "9+" : conversation.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-slate-50/60 p-4">
              {loadingThread ? (
                <p className="text-center text-sm font-semibold text-slate-500">
                  Carregando mensagens…
                </p>
              ) : messages.length === 0 ? (
                <p className="text-center text-sm font-medium text-slate-500">
                  Envie a primeira mensagem para {activeOtherUserName}.
                </p>
              ) : (
                messages.map((message) => {
                  const isMine = viewerUserId
                    ? message.senderId === viewerUserId
                    : message.senderId !== activeOtherUserId;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-6 shadow-sm ${
                          isMine
                            ? "rounded-br-md bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                            : "rounded-bl-md border border-cyan-400/15 bg-white text-slate-800"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{message.body}</p>
                        <p
                          className={`mt-1 text-[10px] font-semibold ${
                            isMine ? "text-cyan-100" : "text-slate-400"
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={sendMessage}
              className="flex items-end gap-2 border-t border-cyan-400/15 bg-white p-3"
            >
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                rows={2}
                maxLength={4000}
                placeholder="Escreva uma mensagem…"
                className="min-h-11 flex-1 resize-none rounded-xl border border-cyan-400/20 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
              >
                {sending ? "…" : "Enviar"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
