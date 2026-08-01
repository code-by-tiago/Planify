"use client";

<<<<<<< HEAD
import { DOCENTE_DISCIPLINAS } from "@/lib/community/docente-utils";
import type { DocenteDisciplina } from "@/lib/community/docente-types";

const ETAPA_OPTIONS = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio"];
const TIPO_OPTIONS = ["Apostila", "Slides", "Prova", "Plano de aula", "Atividade", "Resumo"];

=======
import {
  DOCENTE_ANO_OPTIONS,
  DOCENTE_DISCIPLINAS,
  DOCENTE_TIPO_OPTIONS,
} from "@/lib/community/docente-utils";
import type { DocenteDisciplina } from "@/lib/community/docente-types";

>>>>>>> origin/aplicar-melhorias-na-producao
type ComunidadeDocenteFeedFiltersProps = {
  mineOnly: boolean;
  friendsOnly: boolean;
  savedOnly: boolean;
  showHidden: boolean;
  selectedDisciplina: DocenteDisciplina | null;
<<<<<<< HEAD
  etapa: string;
  tipoMaterial: string;
  tag: string;
=======
  anoSerie: string;
  tipoMaterial: string;
  searchQuery: string;
>>>>>>> origin/aplicar-melhorias-na-producao
  onToggleMineOnly: () => void;
  onToggleFriendsOnly: () => void;
  onToggleSavedOnly: () => void;
  onToggleShowHidden: () => void;
  onSelectDisciplina: (disciplina: DocenteDisciplina | null) => void;
<<<<<<< HEAD
  onEtapaChange: (value: string) => void;
  onTipoMaterialChange: (value: string) => void;
  onTagChange: (value: string) => void;
};

=======
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

>>>>>>> origin/aplicar-melhorias-na-producao
export function ComunidadeDocenteFeedFilters({
  mineOnly,
  friendsOnly,
  savedOnly,
  showHidden,
  selectedDisciplina,
<<<<<<< HEAD
  etapa,
  tipoMaterial,
  tag,
=======
  anoSerie,
  tipoMaterial,
  searchQuery,
>>>>>>> origin/aplicar-melhorias-na-producao
  onToggleMineOnly,
  onToggleFriendsOnly,
  onToggleSavedOnly,
  onToggleShowHidden,
  onSelectDisciplina,
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/aplicar-melhorias-na-producao
      </div>
    </section>
  );
}
