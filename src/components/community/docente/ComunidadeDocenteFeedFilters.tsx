"use client";

import { DOCENTE_DISCIPLINAS } from "@/lib/community/docente-utils";
import type { DocenteDisciplina } from "@/lib/community/docente-types";

const ETAPA_OPTIONS = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio"];
const TIPO_OPTIONS = ["Apostila", "Slides", "Prova", "Plano de aula", "Atividade", "Resumo"];

type ComunidadeDocenteFeedFiltersProps = {
  mineOnly: boolean;
  friendsOnly: boolean;
  savedOnly: boolean;
  showHidden: boolean;
  selectedDisciplina: DocenteDisciplina | null;
  etapa: string;
  tipoMaterial: string;
  tag: string;
  onToggleMineOnly: () => void;
  onToggleFriendsOnly: () => void;
  onToggleSavedOnly: () => void;
  onToggleShowHidden: () => void;
  onSelectDisciplina: (disciplina: DocenteDisciplina | null) => void;
  onEtapaChange: (value: string) => void;
  onTipoMaterialChange: (value: string) => void;
  onTagChange: (value: string) => void;
};

export function ComunidadeDocenteFeedFilters({
  mineOnly,
  friendsOnly,
  savedOnly,
  showHidden,
  selectedDisciplina,
  etapa,
  tipoMaterial,
  tag,
  onToggleMineOnly,
  onToggleFriendsOnly,
  onToggleSavedOnly,
  onToggleShowHidden,
  onSelectDisciplina,
  onEtapaChange,
  onTipoMaterialChange,
  onTagChange,
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
        <button
          type="button"
          onClick={onToggleShowHidden}
          className={[
            "rounded-xl px-3 py-1.5 text-xs font-bold transition",
            showHidden
              ? "bg-amber-500 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-amber-200",
          ].join(" ")}
        >
          {showHidden ? "Mostrando ocultos" : "Ver ocultos"}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <select
          value={etapa}
          onChange={(e) => onEtapaChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="">Todas as etapas</option>
          {ETAPA_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select
          value={tipoMaterial}
          onChange={(e) => onTipoMaterialChange(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="">Todos os tipos</option>
          {TIPO_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={tag}
          onChange={(e) => onTagChange(e.target.value)}
          placeholder="Tag ou tema…"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-cyan-400"
        />
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
