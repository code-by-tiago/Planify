"use client";

import { ComunidadeDocenteDiscussionCard } from "@/components/community/docente/ComunidadeDocenteDiscussionCard";
import type { DocenteDiscussion } from "@/lib/community/docente-types";

type ComunidadeDocenteDiscussionsProps = {
  discussions: DocenteDiscussion[];
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
};

export function ComunidadeDocenteDiscussions({
  discussions,
  onLike,
  onSave,
  onComment,
  onShare,
}: ComunidadeDocenteDiscussionsProps) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-[#0F172A] sm:text-xl">
          Discussões em destaque
        </h2>
      </div>

      <div className="space-y-3">
        {discussions.map((discussion) => (
          <ComunidadeDocenteDiscussionCard
            key={discussion.id}
            discussion={discussion}
            onLike={onLike}
            onSave={onSave}
            onComment={onComment}
            onShare={onShare}
          />
        ))}
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-cyan-600 transition hover:border-cyan-200 hover:bg-cyan-50"
      >
        Ver mais discussões
      </button>
    </section>
  );
}
