"use client";

import { MaterialDocumentPreview } from "@/components/materiais/MaterialDocumentPreview";
import { MaterialFlashcardsPreview } from "@/components/materiais/preview/MaterialFlashcardsPreview";
import { MaterialQuestionsPreview } from "@/components/materiais/preview/MaterialQuestionsPreview";
import { MaterialSectionsPreview } from "@/components/materiais/preview/MaterialSectionsPreview";
import { MaterialSlidesPreview } from "@/components/materiais/preview/MaterialSlidesPreview";
import { MaterialMindMapPreview } from "@/components/materiais/preview/MaterialMindMapPreview";
import { hasMindMapInHtml } from "@/lib/materiais/material-preview-parse";

type MaterialTypedPreviewProps = {
  html: string;
  tipoMaterial?: string;
};

const TIMELINE_TYPES = new Set(["plano-aula", "sequencia"]);
const SECTION_TYPES = new Set([
  "apostila",
  "atividade",
  "jogo",
  "projeto",
  "resumo",
  "redacao",
  "inclusao",
]);

export function MaterialTypedPreview({
  html,
  tipoMaterial,
}: MaterialTypedPreviewProps) {
  const tipo = tipoMaterial?.trim() || "";

  if (!html.trim()) {
    return null;
  }

  if (tipo === "slides") {
    return <MaterialSlidesPreview html={html} />;
  }

  if (tipo === "prova" || tipo === "lista") {
    return (
      <MaterialQuestionsPreview
        html={html}
        tipoMaterial={tipo}
      />
    );
  }

  if (tipo === "flashcards") {
    return <MaterialFlashcardsPreview html={html} />;
  }

  if (tipo === "mapa-mental" || hasMindMapInHtml(html)) {
    return <MaterialMindMapPreview html={html} />;
  }

  if (tipo === "redacao") {
    return (
      <MaterialSectionsPreview
        html={html}
        tipoMaterial={tipo}
        mode="sections"
      />
    );
  }

  if (TIMELINE_TYPES.has(tipo)) {
    return (
      <MaterialSectionsPreview
        html={html}
        tipoMaterial={tipo}
        mode="timeline"
      />
    );
  }

  if (SECTION_TYPES.has(tipo)) {
    return (
      <MaterialSectionsPreview
        html={html}
        tipoMaterial={tipo}
        mode="sections"
      />
    );
  }

  return <MaterialDocumentPreview html={html} tipoMaterial={tipoMaterial} />;
}
