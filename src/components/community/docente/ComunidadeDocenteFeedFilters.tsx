"use client";

import {
  DOCENTE_ANO_OPTIONS,
  DOCENTE_DISCIPLINAS,
  DOCENTE_TIPO_OPTIONS,
} from "@/lib/community/docente-utils";
import type { DocenteDisciplina } from "@/lib/community/docente-types";

type ComunidadeDocenteFeedFiltersProps = {
  mineOnly: boolean;
  friendsOnly: boolean;
  savedOnly: boolean;
  showHidden: boolean;
  selectedDisciplina: DocenteDisciplina | null;
  anoSerie: string;
  tipoMaterial: string;
  searchQuery: string;
  onToggleMineOnly: () => void;
  onToggleFriendsOnly: () => void;
  onToggleSavedOnly: () => void;
  onToggleShowHidden: () => void;
  onSelectDisciplina: (disciplina: DocenteDisciplina | null) => void;
  onAnoSerieChange: (value: string) => void;
  onTipoMaterialChange: (value: string) => void;
  onSearchChange: (value: string) => void;
};

function Pill({
  active,
  onClick,
  children,
  tone = "dark",
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "dark" | "cyan" | "amber";
}) {
  const activeClass =
    tone === "cyan"
      ? "bg-cyan-500 text-white"
      : tone === "amber"
        ? "bg-amber-500 text-white"
        : "bg-[#0F172A] text-white";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-h-11 rounded-full px-3.5 py-1.5 text-xs font-bold transition",
        active
          ? activeClass
          : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-200",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function ComunidadeDocenteFeedFilters({
  mineOnly,
  friendsOnly,
  savedOnly,
  showHidden,
  selectedDisciplina,
  anoSerie,
  tipoMaterial,
  searchQuery,
  onToggleMineOnly,
  onToggleFriendsOnly,
  onToggleSavedOnly,
  onToggleShowHidden,
  onSelectDisciplina,
  onAnoSerieChange,
  onTipoMaterialChange,
  onSearchChange,
}: ComunidadeDocenteFeedFiltersProps) {
  return (
    <section className="space-y-4">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-xl font-extrabold tracking-tight text-[#0F172A] sm:text-2xl">
          Materiais da Comunidade
        </h2>
        <label className="relative mt-4 block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Busque por matéria, tema ou código BNCC..."
            className="min-h-12 w-full rounded-2xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Pill active={mineOnly} onClick={onToggleMineOnly}>
          Meus conteúdos
        </Pill>
        <Pill active={friendsOnly} onClick={onToggleFriendsOnly}>
          Só quem sigo
        </Pill>
        <Pill active={savedOnly} onClick={onToggleSavedOnly}>
          Salvos
        </Pill>
        <Pill active={showHidden} onClick={onToggleShowHidden} tone="amber">
          {showHidden ? "Mostrando ocultos" : "Ver ocultos"}
        </Pill>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Disciplina
        </p>
        <div className="flex flex-wrap gap-2">
          <Pill
            active={!selectedDisciplina}
            onClick={() => onSelectDisciplina(null)}
            tone="cyan"
          >
            Todas
          </Pill>
          {DOCENTE_DISCIPLINAS.map((disciplina) => (
            <Pill
              key={disciplina}
              active={selectedDisciplina === disciplina}
              onClick={() =>
                onSelectDisciplina(selectedDisciplina === disciplina ? null : disciplina)
              }
              tone="cyan"
            >
              {disciplina}
            </Pill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Ano escolar
        </p>
        <div className="flex flex-wrap gap-2">
          <Pill active={!anoSerie} onClick={() => onAnoSerieChange("")} tone="cyan">
            Todos
          </Pill>
          {DOCENTE_ANO_OPTIONS.map((ano) => (
            <Pill
              key={ano}
              active={anoSerie === ano}
              onClick={() => onAnoSerieChange(anoSerie === ano ? "" : ano)}
              tone="cyan"
            >
              {ano}
            </Pill>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Tipo
        </p>
        <div className="flex flex-wrap gap-2">
          <Pill active={!tipoMaterial} onClick={() => onTipoMaterialChange("")} tone="cyan">
            Todos
          </Pill>
          {DOCENTE_TIPO_OPTIONS.map((tipo) => (
            <Pill
              key={tipo}
              active={tipoMaterial === tipo}
              onClick={() => onTipoMaterialChange(tipoMaterial === tipo ? "" : tipo)}
              tone="cyan"
            >
              {tipo}
            </Pill>
          ))}
        </div>
      </div>
    </section>
  );
}
