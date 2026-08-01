"use client";

import { useMemo, useState } from "react";
import { PLANIFY_EXPORT_CSS } from "@/lib/editor/editor-print-html";
import { parseSlidesFromHtml } from "@/lib/materiais/material-preview-parse";
import { MaterialPreviewChrome } from "@/components/materiais/preview/MaterialPreviewChrome";
import { MaterialDocumentPreview } from "@/components/materiais/MaterialDocumentPreview";

type MaterialSlidesPreviewProps = {
  html: string;
};

export function MaterialSlidesPreview({ html }: MaterialSlidesPreviewProps) {
  const slides = useMemo(() => parseSlidesFromHtml(html), [html]);
  const [index, setIndex] = useState(0);

  if (slides.length <= 1) {
    return <MaterialDocumentPreview html={html} tipoMaterial="slides" />;
  }

  const items = slides.map((_, i) => ({
    id: `slide-${i}`,
    title: `Slide ${i + 1}`,
  }));

  return (
    <MaterialPreviewChrome
      label="Pré-visualização dos slides"
      index={index}
      total={slides.length}
      onPrev={() => setIndex((v) => Math.max(0, v - 1))}
      onNext={() => setIndex((v) => Math.min(slides.length - 1, v + 1))}
      onSelect={setIndex}
      items={items}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-200/60 shadow-inner">
        <div className="max-h-[min(55vh,520px)] overflow-y-auto overscroll-contain bg-white px-3 py-4 sm:max-h-[min(70vh,820px)] sm:px-8 sm:py-8">
          <style dangerouslySetInnerHTML={{ __html: PLANIFY_EXPORT_CSS }} />
          <main
            className="planify-export-document planify-preview-slides mx-auto"
            dangerouslySetInnerHTML={{ __html: slides[index] ?? "" }}
          />
        </div>
      </div>
    </MaterialPreviewChrome>
  );
}
