"use client";

import { useMemo, useState } from "react";
import { MaterialDocumentPreview } from "@/components/materiais/MaterialDocumentPreview";

type MaterialCrosswordPreviewProps = {
  html: string;
  incluirGabarito?: boolean;
};

type PreviewTab = "aluno" | "gabarito";

function htmlForTab(html: string, tab: PreviewTab): string {
  if (tab === "gabarito") return html;

  return html.replace(
    /<div class="[^"]*planify-game-teacher-block[^"]*">[\s\S]*?(?=<\/section>)/gi,
    "",
  );
}

export function MaterialCrosswordPreview({
  html,
  incluirGabarito = true,
}: MaterialCrosswordPreviewProps) {
  const [tab, setTab] = useState<PreviewTab>("aluno");

  const previewHtml = useMemo(() => htmlForTab(html, tab), [html, tab]);

  if (!/planify-game-table--crossword/i.test(html)) {
    return <MaterialDocumentPreview html={html} tipoMaterial="cruzadinha" />;
  }

  return (
    <div className="space-y-4">
      {incluirGabarito ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("aluno")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === "aluno"
                ? "bg-cyan-600 text-white shadow-md"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Versão do aluno
          </button>
          <button
            type="button"
            onClick={() => setTab("gabarito")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === "gabarito"
                ? "bg-cyan-600 text-white shadow-md"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Gabarito
          </button>
        </div>
      ) : null}

      <MaterialDocumentPreview html={previewHtml} tipoMaterial="cruzadinha" />
    </div>
  );
}
