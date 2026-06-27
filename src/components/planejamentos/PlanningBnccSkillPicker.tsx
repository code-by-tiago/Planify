"use client";

import { useMemo, useState } from "react";
import type { BnccSkillOption } from "@/lib/bncc/bncc-suggestion-ui";

const BNCC_HIGH_RELEVANCE_SCORE = 16;
const BNCC_MIN_RELEVANCE_SCORE = 8;
const MAX_SKILLS_PER_CONTENT = 3;

type PlanningBnccSkillPickerProps = {
  group: {
    conteudo: string;
    catalogo?: BnccSkillOption[];
    recomendadas?: BnccSkillOption[];
    meta?: {
      catalogTotal?: number;
      recommendedTotal?: number;
      componente?: string;
      etapa?: string;
      anoSerie?: string;
    };
  };
  selectedSkills: BnccSkillOption[];
  loading?: boolean;
  refreshing?: boolean;
  onToggleSkill: (skill: BnccSkillOption) => void;
  onSelectTopRecommended: (skills: BnccSkillOption[]) => void;
  onClearGroup: () => void;
  onRefresh?: () => void;
};

function Pill({
  children,
  tone = "cyan",
}: {
  children: React.ReactNode;
  tone?: "cyan" | "emerald" | "slate" | "amber";
}) {
  const styles = {
    cyan: "border-cyan-400/25 bg-cyan-50 text-cyan-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black ${styles[tone]}`}>
      {children}
    </span>
  );
}

function relevanceBadge(score?: number): { label: string; tone: "emerald" | "cyan" | "amber" } | null {
  if (typeof score !== "number") {
    return null;
  }

  if (score >= BNCC_HIGH_RELEVANCE_SCORE) {
    return { label: "Alta compatibilidade", tone: "emerald" };
  }

  if (score >= BNCC_MIN_RELEVANCE_SCORE) {
    return { label: "Compatível", tone: "cyan" };
  }

  return null;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function matchesSearch(skill: BnccSkillOption, query: string): boolean {
  if (!query) return true;

  const haystack = normalizeSearch(`${skill.codigo} ${skill.descricao}`);
  return haystack.includes(query);
}

function SkillCheckboxRow({
  skill,
  checked,
  disabled,
  disabledTitle,
  onToggle,
}: {
  skill: BnccSkillOption;
  checked: boolean;
  disabled: boolean;
  disabledTitle?: string;
  onToggle: () => void;
}) {
  const badge = relevanceBadge(skill.relevanceScore ?? skill.score);
  const inputId = `bncc-skill-${skill.id}`;

  return (
    <label
      htmlFor={inputId}
      title={disabled ? disabledTitle : undefined}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${
        checked
          ? "border-emerald-300/60 bg-emerald-50/80"
          : disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 opacity-60"
            : "border-cyan-400/15 bg-white/80 hover:border-cyan-400/35 hover:bg-cyan-50/40"
      }`}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-slate-950">{skill.codigo}</span>
        <span className="mt-1 block text-sm leading-6 text-slate-600">{skill.descricao}</span>
        {badge ? (
          <span className="mt-2 inline-block">
            <Pill tone={badge.tone}>{badge.label}</Pill>
          </span>
        ) : null}
      </span>
    </label>
  );
}

function SelectedSkillCard({ skill }: { skill: BnccSkillOption }) {
  const badge = relevanceBadge(skill.relevanceScore ?? skill.score);

  return (
    <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/80 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-extrabold text-slate-950">{skill.codigo}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{skill.descricao}</p>
          {skill.justificativaPedagogica ? (
            <p className="mt-3 rounded-lg border border-slate-200/80 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600">
              {skill.justificativaPedagogica}
            </p>
          ) : null}
        </div>
        {badge ? <Pill tone={badge.tone}>{badge.label}</Pill> : null}
      </div>
    </div>
  );
}

export function PlanningBnccSkillPicker({
  group,
  selectedSkills,
  loading = false,
  refreshing = false,
  onToggleSkill,
  onSelectTopRecommended,
  onClearGroup,
  onRefresh,
}: PlanningBnccSkillPickerProps) {
  const [search, setSearch] = useState("");
  const [catalogExpanded, setCatalogExpanded] = useState(false);

  const catalogo = group.catalogo ?? [];
  const recomendadas = group.recomendadas ?? group.catalogo?.slice(0, 10) ?? [];
  const normalizedSearch = normalizeSearch(search);

  const selectedForContent = useMemo(
    () => selectedSkills.filter((skill) => skill.conteudo === group.conteudo),
    [selectedSkills, group.conteudo],
  );

  const selectedCount = selectedForContent.length;
  const atLimit = selectedCount >= MAX_SKILLS_PER_CONTENT;
  const limitTitle = "Máximo 3 habilidades por conteúdo (padrão do planejamento oficial).";

  const filteredRecommended = useMemo(
    () => recomendadas.filter((skill) => matchesSearch(skill, normalizedSearch)),
    [recomendadas, normalizedSearch],
  );

  const filteredCatalog = useMemo(
    () => catalogo.filter((skill) => matchesSearch(skill, normalizedSearch)),
    [catalogo, normalizedSearch],
  );

  const catalogOnly = useMemo(() => {
    const recommendedCodes = new Set(recomendadas.map((skill) => skill.codigo.toUpperCase()));
    return filteredCatalog.filter((skill) => !recommendedCodes.has(skill.codigo.toUpperCase()));
  }, [filteredCatalog, recomendadas]);

  const isSelected = (skill: BnccSkillOption) =>
    selectedSkills.some((item) => item.id === skill.id);

  const metaLine = [
    `${recomendadas.length} recomendadas`,
    `${catalogo.length} no catálogo`,
    `${selectedCount}/${MAX_SKILLS_PER_CONTENT} selecionadas`,
  ].join(" · ");

  const contextLine = [
    group.meta?.componente,
    group.meta?.etapa,
    group.meta?.anoSerie,
  ]
    .filter(Boolean)
    .join(" · ");

  const topThreeRecommended = recomendadas.slice(0, MAX_SKILLS_PER_CONTENT);

  return (
    <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-600">Conteúdo</p>
          <h3 className="mt-2 text-sm font-semibold text-slate-900">{group.conteudo}</h3>
          {contextLine ? (
            <p className="mt-2 text-xs font-medium text-slate-500">{contextLine}</p>
          ) : null}
          <p className="mt-2 text-xs font-bold text-slate-600">{metaLine}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading || refreshing}
              className="rounded-xl border border-cyan-400/30 bg-cyan-50 px-4 py-2 text-xs font-black text-cyan-900 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Atualizando..." : "Atualizar habilidades"}
            </button>
          ) : null}
          {selectedCount > 0 ? (
            <button
              type="button"
              onClick={onClearGroup}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:border-rose-300 hover:bg-slate-50 hover:text-rose-700"
            >
              Limpar seleção
            </button>
          ) : null}
        </div>
      </div>

      <label className="mt-5 block">
        <span className="sr-only">Buscar por código ou palavra-chave</span>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por código ou palavra-chave…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-100"
        />
      </label>

      {catalogo.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-amber-200 bg-amber-50/70 p-5 text-sm leading-7 text-amber-900">
          Nenhuma habilidade para esta etapa/disciplina. Confira ano e componente acima.
        </div>
      ) : (
        <>
          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
              Recomendadas para este conteúdo
            </p>
            <div className="mt-3 grid gap-2">
              {filteredRecommended.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma recomendada corresponde à busca.</p>
              ) : (
                filteredRecommended.map((skill) => {
                  const checked = isSelected(skill);
                  const disabled = !checked && atLimit;

                  return (
                    <SkillCheckboxRow
                      key={skill.id}
                      skill={skill}
                      checked={checked}
                      disabled={disabled}
                      disabledTitle={limitTitle}
                      onToggle={() => onToggleSkill(skill)}
                    />
                  );
                })
              )}
            </div>
            {topThreeRecommended.length > 0 ? (
              <button
                type="button"
                onClick={() => onSelectTopRecommended(topThreeRecommended)}
                className="mt-3 rounded-xl border border-emerald-300/40 bg-emerald-50 px-4 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
              >
                Usar top 3 recomendadas
              </button>
            ) : null}
          </div>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setCatalogExpanded((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-bold text-slate-800 transition hover:border-cyan-300"
            >
              <span>
                {catalogExpanded ? "Ocultar" : "Ver"} todas as habilidades ({catalogo.length})
              </span>
              <span aria-hidden>{catalogExpanded ? "▲" : "▼"}</span>
            </button>
            {catalogExpanded ? (
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                {catalogOnly.length === 0 ? (
                  <p className="px-2 py-3 text-sm text-slate-500">
                    {normalizedSearch
                      ? "Nenhuma habilidade extra corresponde à busca."
                      : "Todas as habilidades já aparecem em Recomendadas."}
                  </p>
                ) : (
                  catalogOnly.map((skill) => {
                    const checked = isSelected(skill);
                    const disabled = !checked && atLimit;

                    return (
                      <SkillCheckboxRow
                        key={skill.id}
                        skill={skill}
                        checked={checked}
                        disabled={disabled}
                        disabledTitle={limitTitle}
                        onToggle={() => onToggleSkill(skill)}
                      />
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        </>
      )}

      {selectedCount > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Selecionadas neste conteúdo ({selectedCount}/{MAX_SKILLS_PER_CONTENT})
          </p>
          <div className="mt-3 grid gap-3">
            {selectedForContent.map((skill) => (
              <SelectedSkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      ) : null}

      {atLimit ? (
        <p className="mt-4 text-xs font-medium text-amber-800">{limitTitle}</p>
      ) : null}
    </div>
  );
}
