"use client";

import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { CommunityReportButton } from "@/components/community/CommunityReportButton";
import type { CommunityMaterialComment } from "@/lib/community/types";
import { renderCommentBodyWithMentions } from "@/lib/community/mention-utils";
import { getCurrentAccessToken } from "@/lib/auth/session-client";
import { parseJsonResponse } from "@/lib/http/parse-json-response";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

type CommunityMaterialCommentsProps = {
  materialId: string;
  initialComments?: CommunityMaterialComment[];
  onCommentsChange?: (count: number) => void;
};

function formatCommentDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function mapApiComment(row: {
  id: string;
  user_id: string | null;
  author_name: string;
  author_avatar_url?: string | null;
  body: string;
  created_at: string;
}): CommunityMaterialComment {
  return {
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name,
    authorAvatarUrl: row.author_avatar_url || null,
    body: row.body,
    createdAt: row.created_at,
  };
}

export function CommunityMaterialComments({
  materialId,
  initialComments = [],
  onCommentsChange,
}: CommunityMaterialCommentsProps) {
  const composerId = useId();
  const [comments, setComments] = useState<CommunityMaterialComment[]>(initialComments);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(initialComments.length === 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/marketplace/materiais/${materialId}/comentarios`, {
        cache: "no-store",
        credentials: "include",
      });
      const data = await parseJsonResponse<{
        comments?: Array<{
          id: string;
          user_id: string | null;
          author_name: string;
          author_avatar_url?: string | null;
          body: string;
          created_at: string;
        }>;
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível carregar comentários.");
      }

      setComments((data?.comments || []).map(mapApiComment));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar comentários.");
    } finally {
      setLoading(false);
    }
  }, [materialId]);

  useEffect(() => {
    setComments(initialComments);
    setLoading(initialComments.length === 0);
  }, [materialId, initialComments]);

  useEffect(() => {
    if (initialComments.length === 0) {
      void load();
    }
  }, [initialComments.length, load, materialId]);

  useEffect(() => {
    onCommentsChange?.(comments.length);
  }, [comments.length, onCommentsChange]);

  const mentionLinks = useMemo(() => {
    const map = new Map<string, string>();

    for (const comment of comments) {
      if (!comment.userId) continue;

      const normalized = comment.authorName.trim().toLowerCase();
      if (normalized) {
        map.set(normalized, comment.userId);
        const firstName = normalized.split(/\s+/)[0];
        if (firstName) {
          map.set(firstName, comment.userId);
        }
      }
    }

    return map;
  }, [comments]);

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

      const data = await parseJsonResponse<{
        comment?: {
          id: string;
          user_id: string | null;
          author_name: string;
          author_avatar_url?: string | null;
          body: string;
          created_at: string;
        };
        error?: { message?: string };
      }>(response);

      if (!response.ok) {
        throw new Error(data?.error?.message || "Não foi possível enviar o comentário.");
      }

      if (data?.comment) {
        setComments((current) => [...current, mapApiComment(data.comment!)]);
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

  return (
    <section
      id={`comments-${materialId}`}
      className="border-t border-cyan-400/10 bg-cyan-50/20 px-3 py-4 sm:px-4"
      aria-label="Comentários do material"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
          Comentários
        </p>
        <span className="text-[11px] font-bold text-slate-500">
          {comments.length} {comments.length === 1 ? "comentário" : "comentários"}
        </span>
      </div>

      {loading ? (
        <p className="mt-3 text-sm font-medium text-slate-500">Carregando comentários…</p>
      ) : comments.length === 0 ? (
        <p className="mt-3 text-sm font-medium text-slate-600">
          Seja o primeiro a comentar este material.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {comments.map((comment) => (
            <li key={comment.id}>
              <article className="flex gap-3 rounded-xl border border-cyan-400/15 bg-white px-3 py-3 shadow-sm">
                <CommunityAuthorAvatar
                  userId={comment.userId}
                  name={comment.authorName}
                  avatarUrl={comment.authorAvatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <CommunityAuthorLink
                      userId={comment.userId}
                      name={comment.authorName}
                      className="text-sm font-extrabold text-slate-950"
                    />
                    <span className="text-[10px] font-semibold text-slate-400">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {renderCommentBodyWithMentions(comment.body, mentionLinks)}
                  </p>
                  {comment.userId ? (
                    <div className="mt-1">
                      <CommunityReportButton
                        targetType="comment"
                        targetId={comment.id}
                        compact
                      />
                    </div>
                  ) : null}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 rounded-xl border border-cyan-400/15 bg-white p-3">
        <label htmlFor={composerId} className="grid gap-2">
          <span className="text-xs font-bold text-slate-700">Seu comentário</span>
          <textarea
            id={composerId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Sugestão de uso, @nome do colega, adaptação para outra série…"
            className="resize-none rounded-xl border border-cyan-400/20 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </label>

        {error ? (
          <p className="mt-2 text-xs font-semibold text-rose-700">{error}</p>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="mt-2 inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
        >
          {busy ? "Enviando…" : "Publicar comentário"}
        </button>
      </div>
    </section>
  );
}
