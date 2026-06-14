"use client";

import { ComunidadeDocenteDiscussionCard } from "@/components/community/docente/ComunidadeDocenteDiscussionCard";
import type { DocenteDiscussion } from "@/lib/community/docente-types";

type ComunidadeDocenteDiscussionsProps = {
  discussions: DocenteDiscussion[];
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onOpen?: (id: string) => void;
  onShowMore?: () => void;
};

export function ComunidadeDocenteDiscussions({
  discussions,
  onLike,
  onSave,
  onComment,
  onShare,
  onOpen,
  onShowMore,
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
          <p className="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
            Nenhuma discussão encontrada. Crie a primeira publicação!
          </p>
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
    </section>
  );
}
