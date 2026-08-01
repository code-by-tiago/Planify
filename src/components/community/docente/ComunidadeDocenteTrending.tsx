"use client";

import { useRef } from "react";
import { CommunityAuthorAvatar } from "@/components/community/CommunityAuthorAvatar";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import { resolveMaterialCoverVisual } from "@/lib/materials/material-cover-visual";
import { firstNameFromFullName, formatDocenteNumber } from "@/lib/community/docente-utils";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteTrendingProps = {
  materials: DocenteMaterial[];
  onOpen: (id: string) => void;
  onShowAll?: () => void;
};

export function ComunidadeDocenteTrending({
  materials,
  onOpen,
  onShowAll,
}: ComunidadeDocenteTrendingProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (materials.length === 0) {
    return (
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#0F172A] sm:text-base">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 text-cyan-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 18l5-6 4 3 6-8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 7h5v5" />
            </svg>
            Conteúdos em alta
          </h2>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
          <p className="text-sm font-semibold text-slate-500">
            Em breve: conteúdos destacados pela Planify.
          </p>
        </div>
      </section>
    );
  }

  function scrollNext() {
    scrollerRef.current?.scrollBy({ left: 220, behavior: "smooth" });
  }

  return (
    <section className="relative">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#0F172A] sm:text-base">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4 text-cyan-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 18l5-6 4 3 6-8" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 7h5v5" />
          </svg>
          Conteúdos em alta
        </h2>
        {onShowAll ? (
          <button
            type="button"
            onClick={onShowAll}
            className="flex shrink-0 items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 transition hover:bg-cyan-100"
          >
            Ver todos
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ) : null}
      </div>

      <div
        ref={scrollerRef}
        className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] snap-x snap-mandatory"
      >
        {materials.map((material) => {
          const visual = resolveMaterialCoverVisual(material.tipoMaterial || material.title);
          const usos = material.downloadsCount ?? material.viewsCount ?? 0;
          return (
            <button
              key={material.id}
              type="button"
              onClick={() => onOpen(material.id)}
              className="group flex w-[190px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md"
            >
              <div
                className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${visual.accent} text-white`}
              >
                <PlanifyIcon name={visual.icon} className="h-8 w-8 opacity-90" />
              </div>
              <div className="flex flex-1 flex-col p-3">
                <span
                  className={`inline-flex self-start items-center gap-1 rounded-full bg-gradient-to-r ${visual.accent} px-2 py-0.5 text-[10px] font-bold text-white`}
                >
                  <PlanifyIcon name={visual.icon} className="h-3 w-3" />
                  {visual.label}
                </span>
                <h3 className="mt-2 line-clamp-2 text-xs font-bold leading-snug text-[#0F172A] group-hover:text-cyan-700">
                  {material.title}
                </h3>
                <div className="mt-auto flex items-center justify-between gap-1 pt-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <CommunityAuthorAvatar
                      userId={material.author.id}
                      name={material.author.name}
                      avatarUrl={material.author.avatarUrl}
                      size="sm"
                      linkable={false}
                    />
                    <span className="truncate text-[11px] font-semibold text-slate-400">
                      {firstNameFromFullName(material.author.name)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-slate-400">
                    <span aria-hidden>🔥</span>
                    {formatDocenteNumber(usos || material.likesCount)}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {materials.length > 2 ? (
        <button
          type="button"
          onClick={scrollNext}
          aria-label="Ver mais conteúdos"
          className="absolute -right-1 top-[52%] z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-sky-600 shadow-md transition hover:bg-sky-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
          </svg>
        </button>
      ) : null}
    </section>
  );
}
