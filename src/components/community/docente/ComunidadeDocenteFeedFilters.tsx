"use client";

import { DOCENTE_DISCIPLINAS } from "@/lib/community/docente-utils";
import type { DocenteDisciplina } from "@/lib/community/docente-types";

type ComunidadeDocenteFeedFiltersProps = {
  mineOnly: boolean;
  friendsOnly: boolean;
  savedOnly: boolean;
  selectedDisciplina: DocenteDisciplina | null;
  onToggleMineOnly: () => void;
  onToggleFriendsOnly: () => void;
  onToggleSavedOnly: () => void;
  onSelectDisciplina: (disciplina: DocenteDisciplina | null) => void;
};

export function ComunidadeDocenteFeedFilters({
  mineOnly,
  friendsOnly,
  savedOnly,
  selectedDisciplina,
  onToggleMineOnly,
  onToggleFriendsOnly,
  onToggleSavedOnly,
  onSelectDisciplina,
}: ComunidadeDocenteFeedFiltersProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500">Filtros:</span>
        <button
          type="button"
          onClick={onToggleMineOnly}
          className={[
            "rounded-xl px-3 py-1.5 text-xs font-bold transition",
            mineOnly
              ? "bg-[#0F172A] text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
          ].join(" ")}
        >
          Meus conteúdos
        </button>
        <button
          type="button"
          onClick={onToggleFriendsOnly}
          className={[
            "rounded-xl px-3 py-1.5 text-xs font-bold transition",
            friendsOnly
              ? "bg-[#0F172A] text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
          ].join(" ")}
        >
          Só quem sigo
        </button>
        <button
          type="button"
          onClick={onToggleSavedOnly}
          className={[
            "rounded-xl px-3 py-1.5 text-xs font-bold transition",
            savedOnly
              ? "bg-[#0F172A] text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
          ].join(" ")}
        >
          Salvos
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500">Disciplina:</span>
        <button
          type="button"
          onClick={() => onSelectDisciplina(null)}
          className={[
            "rounded-xl px-3 py-1.5 text-xs font-bold transition",
            !selectedDisciplina
              ? "bg-cyan-500 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
          ].join(" ")}
        >
          Todas
        </button>
        {DOCENTE_DISCIPLINAS.map((disciplina) => (
          <button
            key={disciplina}
            type="button"
            onClick={() =>
              onSelectDisciplina(selectedDisciplina === disciplina ? null : disciplina)
            }
            className={[
              "rounded-xl px-3 py-1.5 text-xs font-bold transition",
              selectedDisciplina === disciplina
                ? "bg-cyan-500 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
            ].join(" ")}
          >
            {disciplina}
          </button>
        ))}
      </div>
    </section>
  );
}
