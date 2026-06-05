import { extractSlideThemeFromHtml } from "@/lib/slides/slide-deck-utils";
import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import type { MaterialEngineResponse } from "@/server/materials/material-engine-types";
import {
  SLIDE_THEMES,
  type SlideThemeId,
} from "@/server/materials/slide-design-themes";

export type SummaryChip = {
  label: string;
  tone: "neutral" | "success" | "info";
};

export type MaterialGenerationSummary = {
  chips: SummaryChip[];
  warnings: string[];
};

function countRegex(html: string, pattern: RegExp): number {
  return html.match(pattern)?.length ?? 0;
}

function resolveSlideThemeLabel(
  html: string,
  estrutura: MaterialEngineResponse | null,
  designSlides?: string,
): string | null {
  const id =
    estrutura?.slideTheme ||
    extractSlideThemeFromHtml(html) ||
    designSlides ||
    null;

  if (!id) return null;

  const theme = SLIDE_THEMES[id as SlideThemeId];
  return theme?.label ?? id;
}

export function buildMaterialGenerationSummary(input: {
  tipo: PlanifyToolId;
  html: string;
  estrutura: MaterialEngineResponse | null;
  designSlides?: string;
  incluirGabarito?: boolean;
}): MaterialGenerationSummary {
  const { tipo, html, estrutura } = input;
  const chips: SummaryChip[] = [];
  const warnings: string[] = [];

  if (tipo === "slides") {
    const slideCount =
      estrutura?.slides?.length ??
      countRegex(html, /class=["'][^"']*planify-slide/i);

    if (slideCount > 0) {
      chips.push({ label: `${slideCount} slides`, tone: "success" });
    }

    const themeLabel = resolveSlideThemeLabel(
      html,
      estrutura,
      input.designSlides,
    );
    if (themeLabel) {
      chips.push({ label: `Tema ${themeLabel}`, tone: "info" });
    }

    const imageCount =
      estrutura?.slides?.filter((s) => s.imageUrl?.trim()).length ??
      countRegex(html, /planify-slide-image/i);

    if (imageCount > 0) {
      chips.push({ label: `${imageCount} imagens`, tone: "success" });
    } else if (slideCount > 2) {
      warnings.push(
        "Nenhuma imagem encontrada — gere de novo ou adicione no editor.",
      );
    }

    const contentSlides =
      estrutura?.slides?.filter(
        (s) => s.layout !== "capa" && s.layout !== "fechamento",
      ).length ?? Math.max(0, slideCount - 2);

    if (contentSlides > 0) {
      chips.push({
        label: `${contentSlides} etapas pedagógicas`,
        tone: "neutral",
      });
    }
  }

  if (tipo === "flashcards") {
    const count =
      estrutura?.flashcards?.length ??
      countRegex(html, /planify-flashcard/i);
    if (count > 0) chips.push({ label: `${count} cartões`, tone: "success" });
  }

  if (tipo === "mapa-mental") {
    const branches = estrutura?.mindMap?.branches?.length ?? 0;
    if (branches > 0) {
      chips.push({ label: `${branches} ramos`, tone: "success" });
    }
    if (estrutura?.mindMap?.central) {
      chips.push({ label: "Tema central definido", tone: "info" });
    }
  }

  if (tipo === "prova" || tipo === "lista") {
    const count =
      estrutura?.exam?.questions?.length ??
      countRegex(html, /planify-questao/i);
    if (count > 0) {
      chips.push({
        label: `${count} ${tipo === "lista" ? "exercícios" : "questões"}`,
        tone: "success",
      });
    }
    if (input.incluirGabarito && /gabarito/i.test(html)) {
      chips.push({ label: "Com gabarito", tone: "info" });
    }
  }

  if (tipo === "plano-aula" || tipo === "sequencia") {
    const sections = estrutura?.sections?.length ?? countRegex(html, /<h2/i);
    if (sections > 0) {
      chips.push({ label: `${sections} seções`, tone: "success" });
    }
  }

  if (/BNCC|habilidade|competência/i.test(html)) {
    chips.push({ label: "BNCC referenciada", tone: "info" });
  }

  if (!chips.length && html.trim()) {
    chips.push({ label: "Material gerado", tone: "success" });
  }

  return { chips, warnings };
}
