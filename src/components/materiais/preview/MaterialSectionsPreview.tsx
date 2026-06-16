"use client";

import { useMemo, useState } from "react";
import { PLANIFY_EXPORT_CSS } from "@/lib/editor/editor-print-html";
import { parseSectionsFromHtml } from "@/lib/materiais/material-preview-parse";
import { MaterialPreviewChrome } from "@/components/materiais/preview/MaterialPreviewChrome";
import { MaterialDocumentPreview } from "@/components/materiais/MaterialDocumentPreview";

type MaterialSectionsPreviewProps = {
  html: string;
  tipoMaterial: string;
  mode?: "timeline" | "sections";
};

export function MaterialSectionsPreview({
  html,
  tipoMaterial,
  mode = "sections",
}: MaterialSectionsPreviewProps) {
  const sections = useMemo(() => parseSectionsFromHtml(html), [html]);
  const [index, setIndex] = useState(0);

  if (sections.length <= 1) {
    return <MaterialDocumentPreview html={html} tipoMaterial={tipoMaterial} />;
  }

  const label =
    mode === "timeline"
      ? "Sequência didática — navegue por etapa"
      : "Pré-visualização por seção";

  return (
    <MaterialPreviewChrome
      label={label}
      index={index}
      total={sections.length}
      onPrev={() => setIndex((v) => Math.max(0, v - 1))}
      onNext={() => setIndex((v) => Math.min(sections.length - 1, v + 1))}
      onSelect={setIndex}
      items={sections.map((section) => ({
        id: section.id,
        title: section.title,
      }))}
    >
      {mode === "timeline" ? (
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-black text-white">
            {index + 1}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-cyan-400/60 to-transparent" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-200/60 shadow-inner">
        <div className="max-h-[min(55vh,480px)] overflow-y-auto overscroll-contain bg-white px-3 py-4 sm:max-h-[min(65vh,720px)] sm:px-8 sm:py-8">
          <style dangerouslySetInnerHTML={{ __html: PLANIFY_EXPORT_CSS }} />
          <main
            className={`planify-export-document planify-preview-${tipoMaterial} mx-auto`}
            dangerouslySetInnerHTML={{ __html: sections[index]?.html ?? "" }}
          />
        </div>
      </div>
    </MaterialPreviewChrome>
  );
}
