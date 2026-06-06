"use client";

import { PLANIFY_EXPORT_CSS } from "@/lib/editor/editor-print-html";

type MaterialDocumentPreviewProps = {
  html: string;
};

export function MaterialDocumentPreview({ html }: MaterialDocumentPreviewProps) {
  return (
    <div className="mt-2">
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        Pré-visualização — layout próximo ao DOCX/PDF
      </p>
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-200/60 shadow-inner">
        <div className="max-h-[min(70vh,820px)] overflow-y-auto overscroll-contain bg-white px-4 py-6 sm:px-8 sm:py-8">
          <style dangerouslySetInnerHTML={{ __html: PLANIFY_EXPORT_CSS }} />
          <main
            className="planify-export-document mx-auto"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}

export default MaterialDocumentPreview;
