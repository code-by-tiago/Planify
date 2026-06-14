"use client";

import Link from "next/link";
import {
  IconBookmark,
  IconComment,
  IconDownload,
  IconEye,
  IconHeart,
} from "@/components/community/docente/docente-icons";
import {
  formatDocenteNumber,
  getDisciplinaColor,
  comunidadeRoutes,
} from "@/lib/community/docente-utils";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteMaterialCardProps = {
  material: DocenteMaterial;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onComment?: (id: string) => void;
  onDownload?: (id: string) => void;
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
  onLike,
  onSave,
  onComment,
  onDownload,
  downloading = false,
}: ComunidadeDocenteMaterialCardProps) {
  return (
    <Link
      href={comunidadeRoutes.material(material.id)}
      className="group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:w-[240px]"
    >
      <div className="relative h-36 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={material.coverUrl}
          alt=""
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0F172A] backdrop-blur-sm">
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
            "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition",
            material.savedByMe
              ? "bg-cyan-500 text-white"
              : "bg-white/90 text-slate-500 hover:text-cyan-600",
          ].join(" ")}
          aria-label="Salvar material"
        >
          <IconBookmark className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span
          className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${getDisciplinaColor(material.disciplina)}`}
        >
          {material.disciplina}
        </span>
        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-[#0F172A]">
          {material.title}
        </h3>
        <p className="mt-1 text-xs font-medium text-slate-500">{material.anoSerie}</p>
        <p className="mt-2 text-xs font-semibold text-slate-600">{material.author.name}</p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
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
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLike(material.id);
              }}
              className={[
                "flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition",
                material.likedByMe ? "text-rose-500" : "text-slate-400 hover:text-rose-500",
              ].join(" ")}
            >
              <IconHeart className="h-3.5 w-3.5" filled={material.likedByMe} />
              {formatDocenteNumber(material.likesCount)}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
