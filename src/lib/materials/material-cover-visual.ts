import type { PlanifyIconName } from "@/lib/pro/planifyTools";
import { planifyTools } from "@/lib/pro/planifyTools";

export type MaterialCoverVisual = {
  label: string;
  icon: PlanifyIconName;
  accent: string;
};

const PLANNING_VISUAL: MaterialCoverVisual = {
  label: "Planejamento",
  icon: "clipboard",
  accent: "from-teal-400 via-cyan-500 to-blue-600",
};

const DEFAULT_VISUAL: MaterialCoverVisual = {
  label: "Material",
  icon: "fileText",
  accent: "from-slate-400 via-slate-500 to-slate-700",
};

function normalizeTypeKey(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^material:/, "")
    .replace(/^planejamento:/, "")
    .replace(/\s+/g, "-");
}

export function resolveMaterialCoverVisual(typeOrLabel: string): MaterialCoverVisual {
  const key = normalizeTypeKey(typeOrLabel);

  if (
    key.includes("planejamento") ||
    key === "anual" ||
    key === "trimestral" ||
    key.includes("trimestre")
  ) {
    if (key.includes("trimestral") || key.includes("trimestre")) {
      return {
        ...PLANNING_VISUAL,
        label: "Trimestral",
        accent: "from-emerald-400 via-teal-500 to-cyan-600",
      };
    }
    if (key.includes("anual")) {
      return {
        ...PLANNING_VISUAL,
        label: "Anual",
        accent: "from-cyan-400 via-blue-500 to-indigo-600",
      };
    }
    return PLANNING_VISUAL;
  }

  const tool = planifyTools.find(
    (entry) =>
      entry.id === key ||
      normalizeTypeKey(entry.title) === key ||
      normalizeTypeKey(entry.shortTitle) === key,
  );

  if (tool) {
    return {
      label: tool.shortTitle || tool.title,
      icon: tool.icon,
      accent: tool.accent,
    };
  }

  const fallbackTool = (id: (typeof planifyTools)[number]["id"]) => {
    const tool = planifyTools.find((entry) => entry.id === id);
    return tool
      ? {
          label: tool.shortTitle || tool.title,
          icon: tool.icon,
          accent: tool.accent,
        }
      : DEFAULT_VISUAL;
  };

  if (key.includes("slide")) return fallbackTool("atividade");
  if (key.includes("prova")) return fallbackTool("prova");
  if (
    key === "lista" ||
    key === "listas" ||
    key.includes("lista") ||
    key.includes("exercicio")
  ) {
    return fallbackTool("lista");
  }
  if (key.includes("crase")) return fallbackTool("lista");
  if (key.includes("flashcard")) return fallbackTool("flashcards");
  if (key === "planejamento" || key === "planejamentos") return PLANNING_VISUAL;

  const display = String(typeOrLabel || "").trim();
  return {
    ...DEFAULT_VISUAL,
    label: display.length > 28 ? `${display.slice(0, 26)}…` : display || DEFAULT_VISUAL.label,
  };
}
