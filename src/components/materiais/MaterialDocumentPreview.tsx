"use client";

import { PLANIFY_EXPORT_CSS } from "@/lib/editor/editor-print-html";

type MaterialDocumentPreviewProps = {
  html: string;
  tipoMaterial?: string;
};

function previewLabel(tipo?: string): string {
  const labels: Record<string, string> = {
    prova: "Pré-visualização da prova",
    lista: "Pré-visualização da lista",
    apostila: "Pré-visualização da apostila",
    atividade: "Pré-visualização da atividade",
    jogo: "Pré-visualização do jogo",
    slides: "Pré-visualização dos slides",
    "plano-aula": "Pré-visualização do plano de aula",
  };
  if (tipo && labels[tipo]) return labels[tipo];
  return "Pré-visualização do material";
}

function previewClass(tipo?: string): string {
  if (!tipo) return "";
  return `planify-preview-${tipo.replace(/[^a-z0-9-]/gi, "")}`;
}

export function MaterialDocumentPreview({
  html,
  tipoMaterial,
}: MaterialDocumentPreviewProps) {
  return (
    <div className="mt-2">
      <p className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">
        {previewLabel(tipoMaterial)}
      </p>
      <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-200/60 shadow-inner">
        <div className="max-h-[min(70vh,820px)] overflow-y-auto overscroll-contain bg-white px-4 py-6 sm:px-8 sm:py-8">
          <style dangerouslySetInnerHTML={{ __html: PLANIFY_EXPORT_CSS }} />
          <main
            className={[
              "planify-export-document mx-auto",
              previewClass(tipoMaterial),
            ]
              .filter(Boolean)
              .join(" ")}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </div>
  );
}

export default MaterialDocumentPreview;
