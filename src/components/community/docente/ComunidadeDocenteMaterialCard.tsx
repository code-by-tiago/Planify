"use client";

import Link from "next/link";
import { PlanifyIcon } from "@/components/pro/PlanifyIcons";
import {
  IconBookmark,
  IconComment,
  IconDownload,
  IconEye,
  IconHeart,
} from "@/components/community/docente/docente-icons";
import {
  formatDisciplinaMeta,
  formatDocenteNumber,
  getDisciplinaColor,
  comunidadeRoutes,
} from "@/lib/community/docente-utils";
import { resolveMaterialCoverVisual } from "@/lib/materials/material-cover-visual";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteMaterialCardProps = {
  material: DocenteMaterial;
  embedded?: boolean;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment?: (id: string) => void;
  onDownload?: (id: string) => void;
  onHide?: (id: string) => void;
  onUnhide?: (id: string) => void;
  isHidden?: boolean;
  downloading?: boolean;
};

const FILE_LABELS: Record<DocenteMaterial["fileType"], string> = {
  pdf: "PDF",
  docx: "DOCX",
  pptx: "PPTX",
  image: "IMG",
};

export function ComunidadeDocenteMaterialCard({
  material,
  embedded = false,
  onLike,
  onSave,
  onComment,
  onDownload,
  onHide,
  onUnhide,
  isHidden = false,
  downloading = false,
}: ComunidadeDocenteMaterialCardProps) {
  const visual = resolveMaterialCoverVisual(material.tipoMaterial || material.title);
  const tipoBadge = material.tipoMaterial?.trim() || visual.label;
  const disciplinaMeta = formatDisciplinaMeta(material.disciplina);

  return (
    <Link
      href={comunidadeRoutes.material(material.id, embedded)}
      className={[
        "pl-hud-hub-app group relative flex min-h-[17rem] flex-col rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg",
        isHidden ? "border-amber-200/80 opacity-90" : "border-slate-200/80",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`pl-hud-hub-tool-icon flex h-11 w-11 shrink-0 items-center justify-center bg-gradient-to-br ${visual.accent}`}
        >
          <PlanifyIcon name={visual.icon} className="h-5 w-5" />
        </span>
        <div className="flex items-center gap-1.5">
          <span className="rounded-lg border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
            {FILE_LABELS[material.fileType]}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSave(material.id);
            }}
            className={[
              "flex h-8 w-8 items-center justify-center rounded-full transition",
              material.savedByMe
                ? "bg-cyan-500 text-white"
                : "border border-slate-200 bg-white text-slate-500 hover:border-cyan-200 hover:text-cyan-600",
            ].join(" ")}
            aria-label="Salvar material"
          >
            <IconBookmark className="h-4 w-4" />
          </button>
        </div>
      </div>

      <span className="mt-3 inline-flex w-fit rounded-full border border-cyan-400/20 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-cyan-800">
        {tipoBadge}
      </span>

      {disciplinaMeta ? (
        <span
          className={`mt-2 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${getDisciplinaColor(material.disciplina)}`}
        >
          {disciplinaMeta}
        </span>
      ) : null}

      <h3 className="mt-2 line-clamp-2 text-sm font-extrabold leading-snug text-slate-950">
        {material.title}
      </h3>
      <p className="mt-1 text-xs font-medium text-slate-500">{material.anoSerie}</p>
      <p className="mt-1 text-xs font-semibold text-slate-600">{material.author.name}</p>

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-cyan-400/10 pt-3">
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
          <IconEye className="h-3.5 w-3.5" />
          {formatDocenteNumber(material.viewsCount)}
        </span>
        <div className="flex items-center gap-1">
          {onComment ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onComment(material.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-cyan-600"
              aria-label="Comentar material"
            >
              <IconComment className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onDownload ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDownload(material.id);
              }}
              disabled={downloading}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-cyan-600 disabled:opacity-60"
              aria-label="Baixar material"
            >
              <IconDownload className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onUnhide ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnhide(material.id);
              }}
              className="min-h-11 rounded-lg px-2 py-1.5 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-50"
              aria-label="Restaurar no feed"
            >
              Restaurar
            </button>
          ) : null}
          {onHide ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHide(material.id);
              }}
              className="min-h-11 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              aria-label="Ocultar do feed"
            >
              Ocultar
            </button>
          ) : null}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLike(material.id);
            }}
            className={[
              "flex min-h-11 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition",
              material.likedByMe ? "text-rose-500" : "text-slate-400 hover:text-rose-500",
            ].join(" ")}
          >
            <IconHeart className="h-3.5 w-3.5" filled={material.likedByMe} />
            {formatDocenteNumber(material.likesCount)}
          </button>
        </div>
      </div>
    </Link>
  );
}
