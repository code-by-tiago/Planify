"use client";

import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import type { BnccSkillGroup, BnccSkillOption } from "@/lib/bncc/bncc-suggestion-ui";

type MaterialBnccSkillsPanelProps = {
  groups: BnccSkillGroup[];
  selectedSkills: BnccSkillOption[];
  loading: boolean;
  temaReady: boolean;
  optional?: boolean;
  title?: string;
  description?: string;
  suggestButtonLabel?: string;
  emptyStateHint?: string;
  onSuggest: () => void;
  onToggleSkill: (skill: BnccSkillOption) => void;
  onSelectGroup: (group: BnccSkillGroup) => void;
  onClearGroup: (group: BnccSkillGroup) => void;
  onClearAll: () => void;
  onRefreshGroup?: (group: BnccSkillGroup) => void;
  refreshingConteudo?: string | null;
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
    amber: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-wide ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export function MaterialBnccSkillsPanel({
  groups,
  selectedSkills,
  loading,
  temaReady,
  optional = false,
  title = "Habilidades BNCC do material",
  description = "Selecione as habilidades que este material deve cobrir. Elas entram no seu Progresso BNCC e servem como referência de alinhamento na geração — o conteúdo continua centrado no tema e nos conteúdos que você definiu. Sem seleção, o sistema estima automaticamente pelo tema.",
  suggestButtonLabel,
  emptyStateHint,
  onSuggest,
  onToggleSkill,
  onSelectGroup,
  onClearGroup,
  onClearAll,
  onRefreshGroup,
  refreshingConteudo = null,
}: MaterialBnccSkillsPanelProps) {
  const suggestedCount = groups.reduce(
    (total, group) => total + group.habilidades.length,
    0,
  );

  const isSelected = (skill: BnccSkillOption) =>
    selectedSkills.some((item) => item.id === skill.id);

  return (
    <section className="md:col-span-2 overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-50/80 via-white to-slate-50/60">
      <div className="border-b border-cyan-400/15 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-700">
                Progresso BNCC
              </p>
              <Link
                href="/dashboard?secao=bncc"
                className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-cyan-800 transition hover:border-cyan-400/40"
              >
                Ver cobertura
                <PlanifyIcon name="arrowRight" className="h-3 w-3" />
              </Link>
            </div>
            <h3 className="mt-2 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
              {title}
              {optional ? (
                <span className="ml-2 text-sm font-bold text-slate-500">(opcional)</span>
              ) : null}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="cyan">{suggestedCount} sugeridas</Pill>
            <Pill tone={selectedSkills.length > 0 ? "emerald" : "amber"}>
              {selectedSkills.length} selecionadas
            </Pill>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onSuggest}
            disabled={loading || !temaReady}
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-white px-4 py-2.5 text-sm font-black text-cyan-900 shadow-sm transition hover:border-cyan-500 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-55"
          >
            <PlanifyIcon name="spark" className="h-4 w-4" />
            {loading
              ? "Buscando habilidades..."
              : suggestButtonLabel || "Sugerir habilidades BNCC"}
          </button>
          {selectedSkills.length > 0 ? (
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
            >
              Limpar seleção
            </button>
          ) : null}
        </div>

        {!temaReady ? (
          <p className="mt-3 text-xs font-semibold text-amber-800">
            Preencha tema, disciplina e ano/série acima para buscar habilidades compatíveis.
          </p>
        ) : null}
      </div>

      {selectedSkills.length > 0 ? (
        <div className="border-b border-emerald-200/60 bg-emerald-50/70 px-4 py-3 sm:px-5">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
            Selecionadas para este material
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedSkills.map((skill) => (
              <button
                key={skill.id}
                type="button"
                onClick={() => onToggleSkill(skill)}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/50 bg-white px-3 py-1.5 text-xs font-bold text-emerald-900 transition hover:border-rose-300 hover:text-rose-700"
                title={skill.descricao}
              >
                <span>{skill.codigo}</span>
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="max-h-[22rem] overflow-y-auto px-4 py-4 sm:px-5">
        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-cyan-300/40 bg-white/70 px-4 py-6 text-sm leading-7 text-slate-500">
            {emptyStateHint ||
              "Nenhuma sugestão ainda. Com disciplina, ano e tema preenchidos, clique em Sugerir habilidades BNCC para escolher o que contará no seu progresso."}
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <div
                key={group.conteudo}
                className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-700">
                      Tema / conteúdo
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {group.conteudo}
                    </p>
                  </div>
                  {group.habilidades.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {onRefreshGroup ? (
                        <button
                          type="button"
                          onClick={() => onRefreshGroup(group)}
                          disabled={loading || refreshingConteudo === group.conteudo}
                          className="rounded-lg border border-cyan-400/30 bg-cyan-50 px-3 py-1.5 text-[11px] font-black text-cyan-900 transition hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {refreshingConteudo === group.conteudo
                            ? "Atualizando..."
                            : "Atualizar habilidades"}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onSelectGroup(group)}
                        className="rounded-lg border border-emerald-300/40 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-800 transition hover:bg-emerald-100"
                      >
                        Selecionar grupo
                      </button>
                      <button
                        type="button"
                        onClick={() => onClearGroup(group)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
                      >
                        Remover
                      </button>
                    </div>
                  ) : null}
                </div>

                {group.habilidades.length === 0 ? (
                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Nenhuma habilidade encontrada para este trecho. Ajuste o tema ou
                    tente outra disciplina.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {group.habilidades.map((skill) => {
                      const selected = isSelected(skill);
                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => onToggleSkill(skill)}
                          className={`rounded-xl border p-3 text-left transition hover:-translate-y-px ${
                            selected
                              ? "border-emerald-300/70 bg-emerald-50/90 shadow-sm"
                              : "border-cyan-400/15 bg-slate-50/50 hover:border-cyan-400/35 hover:bg-cyan-50/40"
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-950">
                                {skill.codigo}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-600">
                                {skill.descricao}
                              </p>
                            </div>
                            <Pill tone={selected ? "emerald" : "slate"}>
                              {selected ? "No progresso" : "Selecionar"}
                            </Pill>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
