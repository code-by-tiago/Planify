"use client";

import {
  IconBookmark,
  IconDownload,
  IconHeart,
} from "@/components/community/docente/docente-icons";
import {
  extractBnccCodesFromText,
  firstNameFromFullName,
  formatDisciplinaMeta,
  formatDocenteNumber,
  getDisciplinaColor,
} from "@/lib/community/docente-utils";
import type { DocenteMaterial } from "@/lib/community/docente-types";

type ComunidadeDocenteMaterialCardProps = {
  material: DocenteMaterial;
  embedded?: boolean;
  onOpen?: (id: string) => void;
  onLike: (id: string) => void;
  onSave: (id: string) => void;
  onDownload?: (id: string) => void;
  onHide?: (id: string) => void;
  onUnhide?: (id: string) => void;
  isHidden?: boolean;
  downloading?: boolean;
};

export function ComunidadeDocenteMaterialCard({
  material,
  onOpen,
  onLike,
  onSave,
  onDownload,
  onHide,
  onUnhide,
  isHidden = false,
  downloading = false,
}: ComunidadeDocenteMaterialCardProps) {
  const disciplinaMeta = formatDisciplinaMeta(material.disciplina);
  const bnccCodes = extractBnccCodesFromText(
    ...(material.tags || []),
    material.title,
    material.tipoMaterial,
  );
  const authorFirst = firstNameFromFullName(material.author.name);
  const usos = material.downloadsCount ?? material.viewsCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onOpen?.(material.id)}
      className={[
        "group flex min-h-[15.5rem] w-full flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md",
        isHidden ? "border-amber-200/80 opacity-90" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {disciplinaMeta ? (
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getDisciplinaColor(material.disciplina)}`}
            >
              {disciplinaMeta}
            </span>
          ) : null}
          {material.tipoMaterial ? (
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
              {material.tipoMaterial}
            </span>
          ) : null}
        </div>
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onSave(material.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onSave(material.id);
            }
          }}
          className={[
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
            material.savedByMe
              ? "bg-cyan-500 text-white"
              : "border border-slate-200 bg-white text-slate-500 hover:border-cyan-200 hover:text-cyan-600",
          ].join(" ")}
          aria-label="Salvar material"
        >
          <IconBookmark className="h-4 w-4" />
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-950">
        {material.title}
      </h3>
      <p className="mt-1 text-xs font-medium text-slate-500">{material.anoSerie}</p>

      {bnccCodes.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {bnccCodes.slice(0, 3).map((code) => (
            <span
              key={code}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600"
            >
              {code}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {material.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={material.author.avatarUrl}
              alt=""
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
              {authorFirst.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="truncate text-xs font-semibold text-slate-600">{authorFirst}</span>
        </div>

        <div className="flex items-center gap-1">
          {onUnhide ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onUnhide(material.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onUnhide(material.id);
                }
              }}
              className="min-h-11 rounded-lg px-2 py-1.5 text-[10px] font-bold text-emerald-600 transition hover:bg-emerald-50"
            >
              Restaurar
            </span>
          ) : null}
          {onHide ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onHide(material.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onHide(material.id);
                }
              }}
              className="min-h-11 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
            >
              Ocultar
            </span>
          ) : null}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onLike(material.id);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onLike(material.id);
              }
            }}
            className={[
              "flex min-h-11 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold transition",
              material.likedByMe ? "text-rose-500" : "text-slate-400 hover:text-rose-500",
            ].join(" ")}
          >
            <IconHeart className="h-3.5 w-3.5" filled={material.likedByMe} />
            {formatDocenteNumber(material.likesCount)}
          </span>
          <span
            className="flex min-h-11 items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-400"
            title="Vezes usado / clonado"
            onClick={(e) => {
              if (!onDownload) return;
              e.preventDefault();
              e.stopPropagation();
              onDownload(material.id);
            }}
          >
            <IconDownload className="h-3.5 w-3.5" />
            {downloading ? "…" : formatDocenteNumber(usos)}
          </span>
        </div>
      </div>
    </button>
  );
}
