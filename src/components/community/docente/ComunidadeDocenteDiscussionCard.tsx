"use client";

import Link from "next/link";
import { CommunityAuthorLink } from "@/components/community/CommunityAuthorLink";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import {
  IconBookmark,
  IconComment,
  IconHeart,
  IconShare,
} from "@/components/community/docente/docente-icons";
import {
  formatDocenteNumber,
  formatDocenteTimeAgo,
  getDisciplinaColor,
} from "@/lib/community/docente-utils";
import type { DocenteDiscussion } from "@/lib/community/docente-types";

type ComunidadeDocenteDiscussionCardProps = {
  discussion: DocenteDiscussion;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onOpen?: (id: string) => void;
};

export function ComunidadeDocenteDiscussionCard({
  discussion,
  onLike,
  onSave,
  onComment,
  onShare,
  onOpen,
}: ComunidadeDocenteDiscussionCardProps) {
  const { author } = discussion;

  return (
    <article className="pf-docente-card group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-cyan-200/80 hover:shadow-md sm:p-5">
      <div className="flex gap-3">
        <CommunityAuthorAvatar
          userId={author.id}
          name={author.name}
          avatarUrl={author.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CommunityAuthorLink userId={author.id} name={author.name} className="text-sm" />
            <span className="text-xs font-medium text-slate-400">
              {formatDocenteTimeAgo(discussion.createdAt)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getDisciplinaColor(discussion.disciplina)}`}
            >
              {discussion.disciplina}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onOpen?.(discussion.id)}
            className="mt-2 block w-full text-left"
          >
            <h3 className="text-base font-bold leading-snug text-[#0F172A] group-hover:text-cyan-700">
              {discussion.title}
            </h3>
          </button>

          {discussion.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
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

          <div className="mt-4 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => onLike(discussion.id)}
              className={[
                "flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition",
                discussion.likedByMe
                  ? "bg-rose-50 text-rose-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-rose-600",
              ].join(" ")}
            >
              <IconHeart className="h-4 w-4" filled={discussion.likedByMe} />
              {formatDocenteNumber(discussion.likesCount)}
            </button>
            <button
              type="button"
              onClick={() => onComment(discussion.id)}
              className="flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-cyan-600"
            >
              <IconComment className="h-4 w-4" />
              {formatDocenteNumber(discussion.commentsCount)}
            </button>
            <button
              type="button"
              onClick={() => onSave(discussion.id)}
              className={[
                "flex min-h-11 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition",
                discussion.savedByMe
                  ? "bg-cyan-50 text-cyan-600"
                  : "text-slate-500 hover:bg-slate-50 hover:text-cyan-600",
              ].join(" ")}
            >
              <IconBookmark className="h-4 w-4" />
              Salvar
            </button>
            <button
              type="button"
              onClick={() => onShare(discussion.id)}
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-[#0F172A]"
            >
              <IconShare className="h-4 w-4" />
              Compartilhar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
