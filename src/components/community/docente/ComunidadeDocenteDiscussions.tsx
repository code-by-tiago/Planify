"use client";

import { ComunidadeDocenteDiscussionCard } from "@/components/community/docente/ComunidadeDocenteDiscussionCard";
import type { DocenteDiscussion } from "@/lib/community/docente-types";

type ComunidadeDocenteDiscussionsProps = {
  discussions: DocenteDiscussion[];
  onLike: (id: string) => void;
  onSave: (id: string) => void;
<<<<<<< HEAD
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onOpen?: (id: string) => void;
  onShowMore?: () => void;
  onCreatePost?: () => void;
=======
  onShare: (id: string) => void;
  onDelete?: (id: string) => void | Promise<void>;
  onOpen?: (id: string) => void;
  onFollow?: (authorId: string) => void;
  onReply?: (id: string, body: string) => Promise<void> | void;
  viewerName?: string;
  viewerAvatarUrl?: string | null;
  viewerUserId?: string | null;
  showHeader?: boolean;
>>>>>>> origin/aplicar-melhorias-na-producao
};

export function ComunidadeDocenteDiscussions({
  discussions,
  onLike,
  onSave,
<<<<<<< HEAD
  onComment,
  onShare,
  onOpen,
  onShowMore,
  onCreatePost,
}: ComunidadeDocenteDiscussionsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A] sm:text-xl">
          Discussões em destaque
        </h2>
      </div>

      <div className="space-y-3">
        {discussions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center">
            <p className="text-sm text-slate-500">Nenhuma discussão encontrada.</p>
            {onCreatePost ? (
              <button
                type="button"
                onClick={onCreatePost}
                className="mt-4 rounded-2xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-cyan-600"
              >
                Criar primeira discussão
              </button>
            ) : null}
          </div>
        ) : (
          discussions.map((discussion) => (
            <ComunidadeDocenteDiscussionCard
              key={discussion.id}
              discussion={discussion}
              onLike={onLike}
              onSave={onSave}
              onComment={onComment}
              onShare={onShare}
              onOpen={onOpen}
            />
          ))
        )}
      </div>

      {discussions.length > 0 ? (
        <button
          type="button"
          onClick={onShowMore}
          className="mt-4 w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-cyan-600 transition hover:border-cyan-200 hover:bg-cyan-50"
        >
          Ver mais discussões
        </button>
      ) : null}
=======
  onShare,
  onDelete,
  onOpen,
  onFollow,
  onReply,
  viewerName,
  viewerAvatarUrl,
  viewerUserId,
  showHeader = true,
}: ComunidadeDocenteDiscussionsProps) {
  return (
    <section className="space-y-4">
      {showHeader ? (
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm font-extrabold text-[#0F172A] sm:text-base">Para você</h2>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4 text-slate-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </div>
      ) : null}

      {discussions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-10 text-center">
          <p className="text-sm font-bold text-[#0F172A]">Ainda não há publicações no feed</p>
          <p className="mt-1 text-xs font-medium text-slate-500">
            Escreva uma dúvida, compartilhe uma ideia ou anexe um material — como no Facebook.
          </p>
        </div>
      ) : (
        discussions.map((discussion) => (
          <ComunidadeDocenteDiscussionCard
            key={discussion.id}
            discussion={discussion}
            onLike={onLike}
            onSave={onSave}
            onShare={onShare}
            onDelete={onDelete}
            onOpen={onOpen}
            onFollow={onFollow}
            onReply={onReply}
            viewerName={viewerName}
            viewerAvatarUrl={viewerAvatarUrl}
            viewerUserId={viewerUserId}
          />
        ))
      )}
>>>>>>> origin/aplicar-melhorias-na-producao
    </section>
  );
}
