"use client";

import { useMemo, useState } from "react";
import { parseFlashcardsFromHtml } from "@/lib/materiais/material-preview-parse";
import { MaterialPreviewChrome } from "@/components/materiais/preview/MaterialPreviewChrome";
import { MaterialDocumentPreview } from "@/components/materiais/MaterialDocumentPreview";

type MaterialFlashcardsPreviewProps = {
  html: string;
};

export function MaterialFlashcardsPreview({ html }: MaterialFlashcardsPreviewProps) {
  const cards = useMemo(() => parseFlashcardsFromHtml(html), [html]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return <MaterialDocumentPreview html={html} tipoMaterial="flashcards" />;
  }

  const current = cards[index];

  return (
    <MaterialPreviewChrome
      label="Flashcards — estude virando o cartão"
      index={index}
      total={cards.length}
      onPrev={() => {
        setFlipped(false);
        setIndex((v) => Math.max(0, v - 1));
      }}
      onNext={() => {
        setFlipped(false);
        setIndex((v) => Math.min(cards.length - 1, v + 1));
      }}
      onSelect={(next) => {
        setFlipped(false);
        setIndex(next);
      }}
      items={cards.map((card) => ({
        id: `fc-${card.index}`,
        title: `Cartão ${card.index}`,
      }))}
    >
      <button
        type="button"
        onClick={() => setFlipped((v) => !v)}
        className="group mx-auto flex min-h-[200px] w-full max-w-md flex-col rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-5 text-left shadow-md transition active:scale-[0.99] hover:border-indigo-300 hover:shadow-lg sm:min-h-[220px] sm:p-6"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
          {flipped ? "Resposta" : "Pergunta"} · {current.index}/{cards.length}
        </span>
        <p className="mt-4 flex-1 text-base font-extrabold leading-relaxed text-slate-950">
          {flipped ? current.back || "—" : current.front || "—"}
        </p>
        <span className="mt-4 text-xs font-semibold text-indigo-700 group-hover:underline">
          Toque para {flipped ? "ver a pergunta" : "revelar a resposta"}
        </span>
      </button>
    </MaterialPreviewChrome>
  );
}
