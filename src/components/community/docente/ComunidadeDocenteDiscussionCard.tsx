"use client";

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
} from "@/lib/community/docente-mock-data";
import type { DocenteDiscussion } from "@/lib/community/docente-types";

type ComunidadeDocenteDiscussionCardProps = {
  discussion: DocenteDiscussion;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
};

export function ComunidadeDocenteDiscussionCard({
  discussion,
  onLike,
  onSave,
  onComment,
  onShare,
}: ComunidadeDocenteDiscussionCardProps) {
  const { author } = discussion;

  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-5">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={author.avatarUrl ?? ""}
          alt=""
          className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-[#0F172A]">{author.name}</p>
            <span className="text-xs font-medium text-slate-400">
              {formatDocenteTimeAgo(discussion.createdAt)}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${getDisciplinaColor(discussion.disciplina)}`}
            >
              {discussion.disciplina}
            </span>
          </div>

          <h3 className="mt-2 text-base font-bold leading-snug text-[#0F172A] group-hover:text-cyan-700">
            {discussion.title}
          </h3>

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
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
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
              className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 hover:text-cyan-600"
            >
              <IconComment className="h-4 w-4" />
              {formatDocenteNumber(discussion.commentsCount)}
            </button>
            <button
              type="button"
              onClick={() => onSave(discussion.id)}
              className={[
                "flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition",
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
