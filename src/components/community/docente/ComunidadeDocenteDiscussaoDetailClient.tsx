"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { CommunityReportButton } from "@/components/community/CommunityReportButton";
import { ComunidadeDocenteDetailShell } from "@/components/community/docente/ComunidadeDocenteDetailShell";
import { downloadMarketplaceMaterial } from "@/lib/marketplace/marketplace-download-client";
import { ComunidadeDocenteUserPicker } from "@/components/community/docente/ComunidadeDocenteUserPicker";
import { IconBookmark, IconHeart, IconShare } from "@/components/community/docente/docente-icons";
import type { CommunityProfileSearchResult } from "@/lib/community/types";
import type { CommunityDiscussionDetail } from "@/server/community/community-docente-service";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { getCurrentAccessToken } from "@/lib/auth/session-client";
import {
  comunidadeRoutes,
  formatDocenteNumber,
  formatDocenteTimeAgo,
  getDisciplinaColor,
  homeWithAba,
  isComunidadeEmbedded,
} from "@/lib/community/docente-utils";

export function ComunidadeDocenteDiscussaoDetailClient({
  postId,
  forceEmbedded,
}: {
  postId: string;
  forceEmbedded?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const embedded = isComunidadeEmbedded(searchParams, forceEmbedded);
  const commentAnchor = searchParams.get("comentario");

  const [discussion, setDiscussion] = useState<CommunityDiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUsers, setInviteUsers] = useState<CommunityProfileSearchResult[]>([]);
  const [downloadingMaterialId, setDownloadingMaterialId] = useState<string | null>(null);

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
      setEditTitle(data.discussion.title);
      setEditBody(data.discussion.body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!postId) return;

    let cancelled = false;
    let channel: ReturnType<ReturnType<typeof getSupabaseBrowserClient>["channel"]> | null = null;

    async function setupRealtime() {
      try {
        const supabase = getSupabaseBrowserClient();
        const token = await getCurrentAccessToken();
        if (!token || cancelled) return;

        channel = supabase
          .channel(`community-discussion-comments-${postId}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "community_comments",
              filter: `post_id=eq.${postId}`,
            },
            () => {
              if (!cancelled) void load();
            },
          )
          .subscribe();
      } catch {
        // polling fallback via manual refresh only
      }
    }

    void setupRealtime();

    return () => {
      cancelled = true;
      if (channel) void channel.unsubscribe();
    };
  }, [load, postId]);

  useEffect(() => {
    if (commentAnchor && !loading && discussion) {
      document.getElementById("comentarios")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [commentAnchor, loading, discussion]);

  const showToast = (message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(""), 3000);
  };

  const handleDownloadAttachment = async (materialId: string, fileName: string) => {
    setDownloadingMaterialId(materialId);
    try {
      await downloadMarketplaceMaterial({
        id: materialId,
        fallbackFileName: fileName,
      });
      showToast("Download iniciado.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível baixar.");
    } finally {
      setDownloadingMaterialId(null);
    }
  };

  const handleLike = async () => {
    if (!discussion || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "like_post", postId }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setDiscussion((prev) =>
          prev ? { ...prev, likedByMe: data.liked, likesCount: data.likesCount } : prev,
        );
      } else {
        showToast(data?.error?.message || "Não foi possível curtir.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!discussion || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_post", postId }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        setDiscussion((prev) => (prev ? { ...prev, savedByMe: data.saved } : prev));
        showToast(data.saved ? "Discussão salva!" : "Removida dos salvos.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}${comunidadeRoutes.discussao(postId, embedded)}`;
    void navigator.clipboard.writeText(url).then(() => {
      showToast("Link copiado para a área de transferência!");
    });
  };

  const handleComment = async () => {
    if (!comment.trim() || submitting) return;
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

  const handleUpdate = async () => {
    if (!editTitle.trim() || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_post",
          postId,
          title: editTitle.trim(),
          body: editBody.trim(),
          disciplina: discussion?.disciplina,
          tags: discussion?.tags || [],
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        showToast("Discussão atualizada!");
        setEditing(false);
        await load();
      } else {
        showToast(data?.error?.message || "Não foi possível salvar.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Excluir esta discussão permanentemente?")) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_post", postId }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        showToast("Discussão excluída.");
        router.push(embedded ? comunidadeRoutes.homeEmbedded : comunidadeRoutes.home);
      } else {
        showToast(data?.error?.message || "Não foi possível excluir.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async () => {
    if (inviteUsers.length === 0 || submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/docente/actions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite_post_participants",
          postId,
          participantUserIds: inviteUsers.map((u) => u.userId),
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok) {
        showToast(`${data.invited} convite(s) enviado(s)!`);
        setInviteUsers([]);
        setInviteOpen(false);
        await load();
      } else {
        showToast(data?.error?.message || "Não foi possível convidar.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const homeHref = homeWithAba("discussoes", embedded);

  if (loading) {
    return (
      <ComunidadeDocenteDetailShell
        embedded={embedded}
        activeMenu="discussoes"
        breadcrumbs={[{ label: "Discussões", href: homeHref }]}
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
        embedded={embedded}
        activeMenu="discussoes"
        breadcrumbs={[{ label: "Discussões", href: homeHref }]}
        title="Discussão"
      >
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-700">{error || "Discussão não encontrada."}</p>
          <button
            type="button"
            onClick={() => router.push(homeHref)}
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
      embedded={embedded}
      activeMenu="discussoes"
      breadcrumbs={[
        { label: "Discussões", href: homeHref },
        ...(discussion.groupId
          ? [{ label: "Grupo", href: comunidadeRoutes.grupo(discussion.groupId, embedded) }]
          : []),
      ]}
      title={discussion.title}
      subtitle={`${discussion.author.name} · ${formatDocenteTimeAgo(discussion.createdAt)}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={submitting}
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
          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSave()}
            className={[
              "flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition",
              discussion.savedByMe
                ? "bg-cyan-50 text-cyan-700"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-cyan-50",
            ].join(" ")}
          >
            <IconBookmark className={`h-4 w-4 ${discussion.savedByMe ? "fill-current" : ""}`} />
            Salvar
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <IconShare className="h-4 w-4" />
            Compartilhar
          </button>
          {!discussion.isAuthor ? (
            <CommunityReportButton targetType="post" targetId={postId} compact />
          ) : null}
          {discussion.isAuthor ? (
            <>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600"
              >
                {editing ? "Cancelar" : "Editar"}
              </button>
              <button
                type="button"
                onClick={() => setInviteOpen((v) => !v)}
                className="rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700"
              >
                Convidar
              </button>
            </>
          ) : null}
        </div>
      }
    >
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {editing ? (
          <div className="space-y-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-cyan-400"
            />
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-400"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleUpdate()}
                className="rounded-xl bg-[#0F172A] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Salvar alterações
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDelete()}
                className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-xs font-bold text-rose-700"
              >
                Excluir discussão
              </button>
            </div>
          </div>
        ) : (
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
              {discussion.attachments.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Materiais anexados ({discussion.attachments.length})
                  </h3>
                  <ul className="mt-3 space-y-2">
                    {discussion.attachments.map((attachment) => (
                      <li
                        key={attachment.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white bg-white px-3 py-2.5 shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#0F172A]">{attachment.title}</p>
                          <p className="truncate text-[11px] text-slate-500">{attachment.fileName}</p>
                        </div>
                        <button
                          type="button"
                          disabled={downloadingMaterialId === attachment.materialId}
                          onClick={() =>
                            void handleDownloadAttachment(attachment.materialId, attachment.fileName)
                          }
                          className="shrink-0 rounded-lg bg-cyan-600 px-3 py-1.5 text-[11px] font-bold text-white disabled:opacity-60"
                        >
                          {downloadingMaterialId === attachment.materialId ? "Baixando…" : "Baixar"}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </article>

      {inviteOpen && discussion.isAuthor ? (
        <section className="rounded-3xl border border-cyan-100 bg-cyan-50/50 p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Convidar participantes</h2>
          <div className="mt-3">
            <ComunidadeDocenteUserPicker
              label="Buscar professor(a)"
              selected={inviteUsers}
              onChange={setInviteUsers}
            />
          </div>
          <button
            type="button"
            disabled={inviteUsers.length === 0 || submitting}
            onClick={() => void handleInvite()}
            className="mt-4 rounded-xl bg-[#0F172A] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50"
          >
            Enviar convites
          </button>
        </section>
      ) : null}

      {discussion.participants.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Participantes convidados</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {discussion.participants.map((p) => (
              <li key={p.id}>
                <Link
                  href={comunidadeRoutes.professor(p.id, embedded)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-cyan-200 hover:text-cyan-700"
                >
                  <CommunityAuthorAvatar userId={p.id} name={p.name} avatarUrl={p.avatarUrl} size="sm" linkable={false} />
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        id="comentarios"
        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm scroll-mt-24"
      >
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
                  {discussion.viewerUserId && item.author.id !== discussion.viewerUserId ? (
                    <div className="mt-1">
                      <CommunityReportButton
                        targetType="post_comment"
                        targetId={item.id}
                        compact
                      />
                    </div>
                  ) : null}
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

      {discussion.relatedDiscussions.length > 0 ? (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-extrabold text-[#0F172A]">Discussões relacionadas</h2>
          <ul className="mt-4 space-y-2">
            {discussion.relatedDiscussions.map((item) => (
              <li key={item.id}>
                <Link
                  href={comunidadeRoutes.discussao(item.id, embedded)}
                  className="block rounded-2xl border border-slate-100 px-4 py-3 transition hover:border-cyan-200"
                >
                  <p className="font-semibold text-[#0F172A]">{item.title}</p>
                  <p className="text-xs text-slate-400">
                    {item.author.name} · {formatDocenteTimeAgo(item.createdAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {status ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold shadow-xl">
          {status}
        </div>
      ) : null}
    </ComunidadeDocenteDetailShell>
  );
}
