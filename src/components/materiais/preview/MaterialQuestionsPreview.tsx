"use client";

import { useMemo, useState } from "react";
import { PLANIFY_EXPORT_CSS } from "@/lib/editor/editor-print-html";
import { parseQuestionsFromHtml } from "@/lib/materiais/material-preview-parse";
import { MaterialPreviewChrome } from "@/components/materiais/preview/MaterialPreviewChrome";
import { MaterialDocumentPreview } from "@/components/materiais/MaterialDocumentPreview";

type MaterialQuestionsPreviewProps = {
  html: string;
  tipoMaterial: "prova" | "lista" | "redacao";
};

export function MaterialQuestionsPreview({
  html,
  tipoMaterial,
}: MaterialQuestionsPreviewProps) {
  const questions = useMemo(() => parseQuestionsFromHtml(html), [html]);
  const [index, setIndex] = useState(0);
  const [showGabarito, setShowGabarito] = useState(false);

  const gabaritoHtml = useMemo(() => {
    if (typeof DOMParser === "undefined") return "";
    const doc = new DOMParser().parseFromString(html, "text/html");
    const table = doc.querySelector(".planify-gabarito-table");
    const block = doc.querySelector(".planify-gabarito-block");
    const section = block || table?.closest("section");
    return section?.outerHTML || block?.outerHTML || "";
  }, [html]);

  if (questions.length <= 1) {
    return <MaterialDocumentPreview html={html} tipoMaterial={tipoMaterial} />;
  }

  const label =
    tipoMaterial === "lista"
      ? "Pré-visualização da lista"
      : tipoMaterial === "redacao"
        ? "Pré-visualização da proposta"
        : "Pré-visualização da prova";

  const items = questions.map((q, i) => ({
    id: `q-${i}`,
    title: q.label,
  }));

  return (
    <div className="space-y-4">
      <MaterialPreviewChrome
        label={label}
        index={index}
        total={questions.length}
        onPrev={() => setIndex((v) => Math.max(0, v - 1))}
        onNext={() => setIndex((v) => Math.min(questions.length - 1, v + 1))}
        onSelect={setIndex}
        items={items}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-slate-200/60 shadow-inner">
          <div className="max-h-[min(55vh,480px)] overflow-y-auto overscroll-contain bg-white px-3 py-4 sm:max-h-[min(65vh,720px)] sm:px-8 sm:py-8">
            <style dangerouslySetInnerHTML={{ __html: PLANIFY_EXPORT_CSS }} />
            <main
              className={`planify-export-document planify-preview-${tipoMaterial} mx-auto`}
              dangerouslySetInnerHTML={{ __html: questions[index]?.html ?? "" }}
            />
          </div>
        </div>
      </MaterialPreviewChrome>

      {gabaritoHtml ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80">
          <button
            type="button"
            onClick={() => setShowGabarito((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-800"
          >
            Gabarito e critérios
            <span className="text-xs font-semibold text-cyan-700">
              {showGabarito ? "Ocultar" : "Mostrar"}
            </span>
          </button>
          {showGabarito ? (
            <div className="border-t border-slate-200 px-4 py-4">
              <style dangerouslySetInnerHTML={{ __html: PLANIFY_EXPORT_CSS }} />
              <main
                className="planify-export-document mx-auto text-sm"
                dangerouslySetInnerHTML={{ __html: gabaritoHtml }}
              />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
