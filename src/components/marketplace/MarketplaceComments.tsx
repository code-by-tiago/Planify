"use client";

import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { getCurrentAccessToken } from "@/lib/auth/session-client";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useCallback, useEffect, useState } from "react";

type Comment = {
  id: string;
  user_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  created_at: string;
};

type MarketplaceCommentsProps = {
  materialId: string;
  materialOwnerId?: string | null;
  viewerUserId?: string | null;
  embedded?: boolean;
};

export function MarketplaceComments({
  materialId,
  materialOwnerId,
  viewerUserId,
  embedded,
}: MarketplaceCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function canDeleteComment(comment: Comment): boolean {
    if (!viewerUserId) return false;
    if (comment.user_id && comment.user_id === viewerUserId) return true;
    return Boolean(materialOwnerId && materialOwnerId === viewerUserId);
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/marketplace/materiais/${materialId}/comentarios`, {
        cache: "no-store",
        credentials: "include",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar comentários.");
      }

      setComments(Array.isArray(data?.comments) ? data.comments : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar comentários.");
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit() {
    const body = text.trim();

    if (body.length < 2) {
      setError("Escreva um comentário antes de enviar.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const token = await getCurrentAccessToken();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      const response = await fetch(`/api/marketplace/materiais/${materialId}/comentarios`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ text: body }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível enviar o comentário.");
      }

      if (data?.comment) {
        setComments((current) => [...current, data.comment as Comment]);
      } else {
        await load();
      }

      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao comentar.");
    } finally {
      setBusy(false);
    }
  }

  async function removeComment(commentId: string) {
    if (!window.confirm("Excluir este comentário?")) {
      return;
    }

    setDeletingId(commentId);
    setError("");

    try {
      const token = await getCurrentAccessToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(
        `/api/marketplace/materiais/${materialId}/comentarios/${commentId}`,
        {
          method: "DELETE",
          headers,
          credentials: "include",
        },
      );

      const data = await parseJsonResponse<{ error?: { message?: string } }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível excluir o comentário.");
      }

      setComments((current) => current.filter((comment) => comment.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir comentário.");
    } finally {
      setDeletingId(null);
    }
  }

  const shellClass = embedded
    ? "mt-2 rounded-2xl border border-violet-100/80 bg-violet-50/30 p-4"
    : "mt-8 rounded-[1.5rem] border border-violet-100 bg-violet-50/40 p-5";

  return (
    <div className={shellClass}>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-700">
        Comentários da comunidade
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-violet-800">Carregando comentários…</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {comments.length === 0 ? (
            <p className="text-sm text-violet-800/90">
              Seja o primeiro a comentar este material.
            </p>
          ) : (
            comments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm"
              >
                <p className="text-xs text-violet-900">
                  <CommunityAuthorLink
                    userId={comment.user_id}
                    name={comment.author_name}
                    className="text-violet-900"
                  />
                  <span className="ml-2 font-semibold text-violet-500">
                    {new Intl.DateTimeFormat("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(comment.created_at))}
                  </span>
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                  {comment.body}
                </p>
                {canDeleteComment(comment) ? (
                  <button
                    type="button"
                    disabled={deletingId === comment.id}
                    onClick={() => void removeComment(comment.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 transition hover:text-rose-700 disabled:opacity-60"
                  >
                    <PlanifyIcon name="trash" className="h-3.5 w-3.5" />
                    {deletingId === comment.id ? "Excluindo…" : "Excluir"}
                  </button>
                ) : null}
              </article>
            ))
          )}
        </div>
      )}

      <label className="mt-4 grid gap-2">
        <span className="text-sm font-bold text-violet-900">Seu comentário</span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          placeholder="Sugestão de uso, adaptação para outra série, elogio..."
          className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm outline-none focus:border-violet-400"
        />
      </label>

      {error ? (
        <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="mt-3 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {busy ? "Enviando..." : "Comentar"}
      </button>
    </div>
  );
}
