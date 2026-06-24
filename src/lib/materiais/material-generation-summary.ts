import type { PlanifyToolId } from "@/lib/pro/planifyTools";
import type { MaterialEngineResponse } from "@/server/materials/material-engine-types";

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
