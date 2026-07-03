"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { IconArrowRight, IconEye, IconHeart } from "@/components/community/docente/docente-icons";
import type { DocenteMaterial } from "@/lib/community/docente-types";
import {
  comunidadeRoutes,
  formatDisciplinaMeta,
  formatDocenteNumber,
  getDisciplinaColor,
} from "@/lib/community/docente-utils";
import { resolveMaterialCoverVisual } from "@/lib/materials/material-cover-visual";

type ComunidadeDocenteTrendingProps = {
  materials: DocenteMaterial[];
  embedded?: boolean;
  onShowAll: () => void;
};

export function ComunidadeDocenteTrending({
  materials,
  embedded = false,
  onShowAll,
}: ComunidadeDocenteTrendingProps) {
  const trending = useMemo(
    () =>
      [...materials]
        .sort(
          (a, b) =>
            b.likesCount + b.viewsCount - (a.likesCount + a.viewsCount),
        )
        .slice(0, 8),
    [materials],
  );

  if (trending.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#0F172A]">
          <PlanifyIcon name="spark" className="h-4 w-4 text-cyan-600" />
          Conteúdos em alta
        </h2>
        <button
          type="button"
          onClick={onShowAll}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-200 bg-cyan-50/60 px-3 py-1.5 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100"
        >
          Ver todos
          <IconArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 flex gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {trending.map((material) => {
          const visual = resolveMaterialCoverVisual(material.tipoMaterial || material.title);
          const disciplinaMeta = formatDisciplinaMeta(material.disciplina);
          return (
            <Link
              key={material.id}
              href={comunidadeRoutes.material(material.id, embedded)}
              className="group flex w-44 shrink-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div
                className={`flex h-28 items-center justify-center rounded-t-2xl bg-gradient-to-br ${visual.accent} text-white`}
              >
                <PlanifyIcon name={visual.icon} className="h-9 w-9 opacity-90" />
              </div>
              <div className="flex min-h-0 flex-1 flex-col p-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-50 px-2 py-0.5 text-[10px] font-bold uppercase text-cyan-800">
                    {material.tipoMaterial?.trim() || visual.label}
                  </span>
                  {disciplinaMeta ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getDisciplinaColor(material.disciplina)}`}
                    >
                      {disciplinaMeta}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-2 line-clamp-2 text-xs font-extrabold leading-snug text-slate-950">
                  {material.title}
                </h3>
                <div className="mt-auto flex items-center justify-between pt-2 text-[11px] font-semibold text-slate-400">
                  <span className="line-clamp-1 max-w-[6rem]">{material.author.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5">
                      <IconEye className="h-3 w-3" />
                      {formatDocenteNumber(material.viewsCount)}
                    </span>
                    <span className="flex items-center gap-0.5 text-rose-400">
                      <IconHeart className="h-3 w-3" filled />
                      {formatDocenteNumber(material.likesCount)}
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
