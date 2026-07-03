"use client";

import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { PlanifyOwlMark } from "@/components/pro/PlanifyOwlMark";
import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { IconArrowRight } from "@/components/community/docente/docente-icons";
import type { DocenteViewerProfile } from "@/lib/community/docente-types";

type ComunidadeDocenteComposerProps = {
  viewerProfile: DocenteViewerProfile | null;
  onCreatePost: () => void;
};

const QUICK_ACTIONS: Array<{ label: string; icon: PlanifyIconName }> = [
  { label: "Aulas", icon: "book" },
  { label: "Materiais", icon: "fileText" },
  { label: "Imagem", icon: "cards" },
  { label: "Arquivo", icon: "clipboard" },
];

export function ComunidadeDocenteComposer({
  viewerProfile,
  onCreatePost,
}: ComunidadeDocenteComposerProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-sm">
          {viewerProfile?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={viewerProfile.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center">
              <PlanifyOwlMark size={32} />
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={onCreatePost}
          className="h-11 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-4 text-left text-sm font-medium text-slate-400 transition hover:border-cyan-200 hover:bg-white"
        >
          Compartilhe com outros professores...
        </button>
        <button
          type="button"
          onClick={onCreatePost}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500 text-white shadow-md shadow-cyan-200/50 transition hover:bg-cyan-600"
          aria-label="Criar publicação"
        >
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-slate-100 pt-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={onCreatePost}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-cyan-50 hover:text-cyan-700"
          >
            <PlanifyIcon name={action.icon} className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}
