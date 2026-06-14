"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { IconHeart } from "@/components/community/docente/docente-icons";
import type { CommunityDiscussionDetail } from "@/server/community/community-docente-service";
import {
  comunidadeRoutes,
  formatDocenteNumber,
  formatDocenteTimeAgo,
  getDisciplinaColor,
} from "@/lib/community/docente-utils";

export function ComunidadeDocenteDiscussaoDetailClient({ postId }: { postId: string }) {
  const router = useRouter();
  const [discussion, setDiscussion] = useState<CommunityDiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/community/docente/discussao/${postId}`, {
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data?.error?.message || "Discussão não encontrada.");
      }
      setDiscussion(data.discussion);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const showToast = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3000);
  };

  const handleLike = async () => {
    if (!discussion) return;
    const response = await fetch("/api/community/docente/actions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like_post", postId }),
    });
    const data = await response.json();
    if (response.ok && data.ok) {
      setDiscussion((prev) =>
        prev
          ? { ...prev, likedByMe: data.liked, likesCount: data.likesCount }
          : prev,
      );
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "comment_post", postId, body: comment.trim() }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setComment("");
        showToast("Comentário publicado!");
        await load();
      } else {
        showToast(data?.error?.message || "Não foi possível comentar.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ComunidadeDocenteDetailShell
        activeMenu="discussoes"
        breadcrumbs={[{ label: "Discussões", href: comunidadeRoutes.home }]}
        title="Carregando…"
      >
        <div className="flex min-h-[200px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-500" />
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  if (error || !discussion) {
    return (
      <ComunidadeDocenteDetailShell
        activeMenu="discussoes"
        breadcrumbs={[{ label: "Discussões", href: comunidadeRoutes.home }]}
        title="Discussão"
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error || "Discussão não encontrada."}</p>
          <button
            type="button"
            onClick={() => router.push(comunidadeRoutes.home)}
            className="mt-3 rounded-xl bg-[#0F172A] px-4 py-2 text-xs font-bold text-white"
          >
            Voltar à comunidade
          </button>
        </div>
      </ComunidadeDocenteDetailShell>
    );
  }

  return (
    <ComunidadeDocenteDetailShell
      activeMenu="discussoes"
      breadcrumbs={[{ label: "Discussões", href: comunidadeRoutes.home }]}
      title={discussion.title}
      subtitle={`${discussion.author.name} · ${formatDocenteTimeAgo(discussion.createdAt)}`}
      actions={
        <button
          type="button"
          onClick={() => void handleLike()}
          className={[
            "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition",
            discussion.likedByMe
              ? "bg-rose-50 text-rose-600"
              : "border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600",
          ].join(" ")}
        >
          <IconHeart className="h-4 w-4" filled={discussion.likedByMe} />
          {formatDocenteNumber(discussion.likesCount)}
        </button>
      }
    >
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <CommunityAuthorAvatar
            userId={discussion.author.id}
            name={discussion.author.name}
            avatarUrl={discussion.author.avatarUrl}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CommunityAuthorLink userId={discussion.author.id} name={discussion.author.name} />
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getDisciplinaColor(discussion.disciplina)}`}
              >
                {discussion.disciplina}
              </span>
            </div>
            <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {discussion.body || "Sem conteúdo adicional."}
            </div>
            {discussion.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {discussion.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </article>

      {discussion.participants.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Participantes convidados</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {discussion.participants.map((p) => (
              <li key={p.id}>
                <Link
                  href={comunidadeRoutes.professor(p.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                >
                  <CommunityAuthorAvatar userId={p.id} name={p.name} avatarUrl={p.avatarUrl} size="sm" />
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#0F172A]">
          Comentários ({formatDocenteNumber(discussion.comments.length)})
        </h2>
        <div className="mt-4 space-y-4">
          {discussion.comments.length === 0 ? (
            <p className="text-sm text-slate-500">Seja o primeiro a comentar.</p>
          ) : (
            discussion.comments.map((item) => (
              <div key={item.id} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0">
                <CommunityAuthorAvatar
                  userId={item.author.id}
                  name={item.author.name}
                  avatarUrl={item.author.avatarUrl}
                  size="sm"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CommunityAuthorLink userId={item.author.id} name={item.author.name} className="text-xs" />
                    <span className="text-[11px] text-slate-400">
                      {formatDocenteTimeAgo(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-700">{item.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 space-y-3">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escreva seu comentário…"
            rows={3}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100"
          />
          <button
            type="button"
            disabled={submitting || !comment.trim()}
            onClick={() => void handleComment()}
            className="rounded-xl bg-[#0F172A] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
          >
            {submitting ? "Publicando…" : "Publicar comentário"}
          </button>
        </div>
      </section>

      {status ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-xl">
          {status}
        </div>
      ) : null}
    </ComunidadeDocenteDetailShell>
  );
}
