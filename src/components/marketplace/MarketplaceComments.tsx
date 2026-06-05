"use client";

import { getCurrentAccessToken } from "@/lib/auth/session-client";
import { useCallback, useEffect, useState } from "react";

type Comment = {
  id: string;
  author_name: string;
  author_email: string | null;
  body: string;
  created_at: string;
};

type MarketplaceCommentsProps = {
  materialId: string;
};

export function MarketplaceComments({ materialId }: MarketplaceCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
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

  return (
    <div className="mt-8 rounded-[1.5rem] border border-violet-100 bg-violet-50/40 p-5">
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
                <p className="text-xs font-black text-violet-900">
                  {comment.author_name}
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
