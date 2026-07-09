"use client";

import { ComunidadeDocenteDiscussionCard } from "@/components/community/docente/ComunidadeDocenteDiscussionCard";
import type { DocenteDiscussion } from "@/lib/community/docente-types";

type ComunidadeDocenteDiscussionsProps = {
  discussions: DocenteDiscussion[];
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
  showHeader?: boolean;
};

export function ComunidadeDocenteDiscussions({
  discussions,
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
    </section>
  );
}
