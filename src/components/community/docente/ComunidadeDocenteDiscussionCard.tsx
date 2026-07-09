"use client";

import { useCallback, useEffect, useState } from "react";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { IconHeart, IconSend, IconShare, IconX } from "@/components/community/docente/docente-icons";
import { ComunidadeDocentePostAttachments } from "@/components/community/docente/ComunidadeDocentePostAttachments";
import {
  badgeEmoji,
  formatDocenteNumber,
  formatDocenteTimeAgo,
} from "@/lib/community/docente-utils";
import { loadDiscussionComments } from "@/lib/community/docente-comments-client";
import type {
  DocenteComment,
  DocenteDiscussion,
} from "@/lib/community/docente-types";

const QUICK_REACTIONS = [
  { emoji: "👏", label: "Parabéns!" },
  { emoji: "👏", label: "Muito bom!" },
  { emoji: "📚", label: "Super útil!" },
];

const AVATAR_COLORS = ["#0891B2", "#7C3AED", "#DB2777", "#059669", "#D97706", "#DC2626", "#4F46E5"];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function CommentAvatar({ author }: { author: DocenteComment["author"] }) {
  if (author.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={author.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
    );
  }
  const initial = (author.name || "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
      style={{ backgroundColor: colorForName(author.name || "?") }}
    >
      {initial}
    </span>
  );
}

type ComunidadeDocenteDiscussionCardProps = {
  discussion: DocenteDiscussion;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onShare: (id: string) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onOpen?: (id: string) => void;
  onFollow?: (authorId: string) => void;
  onReply?: (id: string, body: string) => Promise<void> | void;
  viewerName?: string;
  viewerAvatarUrl?: string | null;
  viewerUserId?: string | null;
};

export function ComunidadeDocenteDiscussionCard({
  discussion,
  onLike,
  onSave,
  onShare,
  onDelete,
  onOpen,
  onFollow,
  onReply,
  viewerName,
  viewerAvatarUrl,
  viewerUserId,
}: ComunidadeDocenteDiscussionCardProps) {
  const { author } = discussion;
  const isAchievement = discussion.kind === "achievement";
  const isOwnPost = Boolean(viewerUserId && author.id === viewerUserId);
  const [comments, setComments] = useState<DocenteComment[]>(
    () => discussion.commentsPreview || [],
  );
  const [commentsLoaded, setCommentsLoaded] = useState(
    () => (discussion.commentsPreview?.length || 0) > 0 || discussion.commentsCount <= 0,
  );
  const [showAllComments, setShowAllComments] = useState(false);
  const [loadingAllComments, setLoadingAllComments] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");

  useEffect(() => {
    setComments(discussion.commentsPreview || []);
    setCommentsLoaded(
      (discussion.commentsPreview?.length || 0) > 0 || discussion.commentsCount <= 0,
    );
    setShowAllComments(false);
  }, [discussion.id, discussion.commentsCount, discussion.commentsPreview]);

  const loadAllComments = useCallback(async () => {
    if (loadingAllComments) return;
    setLoadingAllComments(true);
    try {
      const list = await loadDiscussionComments(discussion.id);
      setComments(list);
      setCommentsLoaded(true);
      setShowAllComments(true);
    } finally {
      setLoadingAllComments(false);
    }
  }, [discussion.id, loadingAllComments]);

  const submitReply = useCallback(
    async (text: string) => {
      const body = text.trim();
      if (!body || !onReply || sending) return;
      setSending(true);
      try {
        await onReply(discussion.id, body);
        setReplyText("");
        const refreshed = await loadDiscussionComments(discussion.id);
        setComments(refreshed);
        setCommentsLoaded(true);
        setShowAllComments(true);
      } finally {
        setSending(false);
      }
    },
    [discussion.id, onReply, sending],
  );

  const handleDelete = useCallback(async () => {
    if (!onDelete || deleting) return;
    if (!window.confirm("Excluir esta publicação permanentemente?\n\nEsta ação não pode ser desfeita.")) {
      setMenuOpen(false);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(discussion.id);
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  }, [deleting, discussion.id, onDelete]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(`[data-post-menu="${discussion.id}"]`)) return;
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen, discussion.id]);

  const visibleComments = showAllComments ? comments : comments.slice(-1);
  const hiddenCommentsCount = Math.max(0, comments.length - visibleComments.length);
  const firstName = author.name.split(" ")[0] || author.name;

  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white px-4 py-4 sm:px-5 sm:py-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <CommunityAuthorAvatar userId={author.id} name={author.name} avatarUrl={author.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <CommunityAuthorLink
                  userId={author.id}
                  name={author.name}
                  className="text-[15px] font-bold text-[#0F172A]"
                />
                {onFollow &&
                author.isFollowing !== undefined &&
                !author.isFollowing &&
                !isOwnPost ? (
                  <button
                    type="button"
                    onClick={() => onFollow(author.id)}
                    className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    Seguir
                  </button>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs font-medium text-slate-400">
                {formatDocenteTimeAgo(discussion.createdAt)}
              </p>
            </div>
            <div className="relative flex shrink-0 items-center gap-0.5" data-post-menu={discussion.id}>
              <button
                type="button"
                onClick={() => onSave(discussion.id)}
                aria-label={discussion.savedByMe ? "Remover dos salvos" : "Salvar"}
                className={[
                  "rounded-lg p-1.5 transition hover:bg-slate-50",
                  discussion.savedByMe ? "text-cyan-600" : "text-slate-400 hover:text-slate-600",
                ].join(" ")}
              >
                <PlanifyIcon name="folder" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onShare(discussion.id)}
                aria-label="Compartilhar"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                <IconShare className="h-4 w-4" />
              </button>
              {isOwnPost && onDelete ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    aria-label="Mais opções"
                    aria-expanded={menuOpen}
                    className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <circle cx="5" cy="12" r="1.75" />
                      <circle cx="12" cy="12" r="1.75" />
                      <circle cx="19" cy="12" r="1.75" />
                    </svg>
                  </button>
                  {menuOpen ? (
                    <div className="absolute right-0 top-9 z-20 min-w-[160px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => void handleDelete()}
                        className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                      >
                        <IconX className="h-3.5 w-3.5" />
                        {deleting ? "Excluindo…" : "Excluir publicação"}
                      </button>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {/* Body — texto livre estilo Facebook */}
          {discussion.body ? (
            <div className="mt-3 space-y-1.5">
              {discussion.title &&
              discussion.title !== discussion.body &&
              !discussion.body.startsWith(discussion.title.replace(/…$/, "")) ? (
                <h3 className="text-sm font-bold leading-snug text-[#0F172A]">{discussion.title}</h3>
              ) : null}
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-700">
                {discussion.body}
              </p>
            </div>
          ) : !isAchievement ? (
            <button
              type="button"
              onClick={() => onOpen?.(discussion.id)}
              className="mt-3 block w-full text-left"
            >
              <h3 className="text-[15px] font-semibold leading-snug text-slate-800">
                {discussion.title}
              </h3>
            </button>
          ) : null}

          {isAchievement && discussion.achievementBadge ? (
            <div
              className="mt-3 flex flex-col items-center gap-3 rounded-2xl px-4 py-8 text-center text-white"
              style={{
                background: `linear-gradient(135deg, ${discussion.achievementBadge.color}, ${discussion.achievementBadge.color}CC)`,
              }}
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-5xl backdrop-blur-sm">
                {badgeEmoji(discussion.achievementBadge.icon)}
              </span>
              <p className="text-lg font-black leading-tight">{discussion.achievementBadge.name}</p>
              <span className="rounded-full bg-white/20 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                Conquista desbloqueada
              </span>
            </div>
          ) : null}

          {/* Attachments — imagens inline; PDF/DOC/PPT como arquivo */}
          {!isAchievement && discussion.attachments && discussion.attachments.length > 0 ? (
            <ComunidadeDocentePostAttachments
              attachments={discussion.attachments}
              onError={(message) => {
                setAttachmentError(message);
                window.setTimeout(() => setAttachmentError(""), 4000);
              }}
            />
          ) : null}

          {attachmentError ? (
            <p className="mt-2 text-xs font-semibold text-rose-600">{attachmentError}</p>
          ) : null}

          {/* Social proof */}
          {(discussion.likesCount > 0 || discussion.commentsCount > 0) && !isAchievement ? (
            <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-slate-500">
              <div className="flex min-w-0 items-center gap-2">
                {discussion.likesCount > 0 ? (
                  <>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px]">
                      ❤️
                    </span>
                    <span className="truncate">
                      {`${formatDocenteNumber(discussion.likesCount)} curtida${discussion.likesCount > 1 ? "s" : ""}`}
                    </span>
                  </>
                ) : (
                  <span />
                )}
              </div>
              {discussion.commentsCount > 0 ? (
                <span className="shrink-0">
                  {formatDocenteNumber(discussion.commentsCount)} comentário
                  {discussion.commentsCount > 1 ? "s" : ""}
                </span>
              ) : null}
            </div>
          ) : null}

          {/* Quick reactions */}
          {onReply && !isAchievement ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_REACTIONS.map((reaction) => (
                <button
                  key={reaction.label}
                  type="button"
                  onClick={() => void submitReply(`${reaction.emoji} ${reaction.label}`)}
                  disabled={sending}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                >
                  {reaction.emoji} {reaction.label}
                </button>
              ))}
            </div>
          ) : null}

          {/* Like */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => onLike(discussion.id)}
              className={[
                "inline-flex items-center gap-1.5 text-sm font-semibold transition",
                discussion.likedByMe
                  ? "text-rose-600"
                  : "text-slate-500 hover:text-rose-600",
              ].join(" ")}
            >
              <IconHeart className="h-4 w-4" filled={discussion.likedByMe} />
              Curtir
            </button>
          </div>

          {/* Reply input */}
          {onReply ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void submitReply(replyText);
              }}
              className="mt-3 flex items-center gap-2.5"
            >
              <CommunityAuthorAvatar
                userId={viewerUserId}
                name={viewerName || "Você"}
                avatarUrl={viewerAvatarUrl}
                size="sm"
                linkable={false}
              />
              <div className="relative flex-1">
                <input
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value)}
                  placeholder={`Responder ${firstName}`}
                  disabled={sending}
                  className="h-10 w-full rounded-full border border-slate-200 bg-white pl-4 pr-10 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-50"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  aria-label="Enviar"
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-cyan-600 transition hover:bg-cyan-50 disabled:opacity-40"
                >
                  <IconSend className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          ) : null}

          {/* Comments */}
          {discussion.commentsCount > comments.length && !showAllComments ? (
            <button
              type="button"
              onClick={() => void loadAllComments()}
              disabled={loadingAllComments}
              className="mt-3 text-xs font-bold text-slate-400 hover:text-cyan-600 disabled:opacity-60"
            >
              {loadingAllComments
                ? "Carregando comentários…"
                : `Ver todos os ${discussion.commentsCount} comentários`}
            </button>
          ) : null}

          {commentsLoaded && comments.length > 0 ? (
            <div className="mt-4 space-y-3 pl-1">
              {hiddenCommentsCount > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (comments.length < discussion.commentsCount) {
                      void loadAllComments();
                    } else {
                      setShowAllComments(true);
                    }
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-cyan-600"
                >
                  Ver mais {hiddenCommentsCount} comentário{hiddenCommentsCount > 1 ? "s" : ""}
                </button>
              ) : null}
              {visibleComments.map((comment) => (
                <div key={comment.id} className="flex gap-2.5">
                  <CommentAvatar author={comment.author} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-sm font-bold text-[#0F172A]">{comment.author.name}</p>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatDocenteTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{comment.body}</p>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] font-bold text-slate-400">
                      <button type="button" className="hover:text-cyan-600">
                        Curtir
                      </button>
                      <button
                        type="button"
                        className="hover:text-cyan-600"
                        onClick={() => setReplyText(`@${comment.author.name.split(" ")[0]} `)}
                      >
                        Responder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

    </article>
  );
}
