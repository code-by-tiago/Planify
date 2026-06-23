import { inferMaterialToolFromHtml } from "@/lib/export/material-export-policy";
import { historyItemContentToHtml } from "@/lib/history/history-preview";
import { resolvePlanningPayloadForGoogleExport } from "@/lib/planejamentos/planning-google-export-payload";
import type { HistoryItem } from "@/types/history";

export function resolveDocumentTypeFromHistoryItem(item: HistoryItem): string {
  const rawType = String(item.type || "").trim();
  const lower = rawType.toLowerCase();

  if (lower.includes("planejamento")) {
    if (lower.includes("trimestral") || lower.includes("trimestre")) {
      return "planejamento:trimestral";
    }
    return "planejamento:anual";
  }

  if (rawType.startsWith("material:")) {
    return rawType;
  }

  const meta = item.raw as { toolId?: string } | undefined;
  const toolId = String(meta?.toolId || "").trim();
  if (toolId) {
    return `material:${toolId}`;
  }

  const normalized = rawType.replace(/^material:/i, "");
  if (normalized && normalized !== "editor") {
    return `material:${normalized}`;
  }

  const html = getHistoryItemHtml(item);
  const inferred = inferMaterialToolFromHtml(html);
  if (inferred) {
    return `material:${inferred}`;
  }

  return rawType || "editor";
}

export function getHistoryItemHtml(item: HistoryItem): string {
  return historyItemContentToHtml(item.content);
}

export function getHistoryPlanningPayload(
  item: HistoryItem,
): Record<string, unknown> | null {
  return resolvePlanningPayloadForGoogleExport(
    item.raw as Parameters<typeof resolvePlanningPayloadForGoogleExport>[0],
    {
      documentType: item.type,
      documentId: item.id,
      title: item.title,
    },
  );
}

export function resolveDocumentTypeFromMarketplaceItem(item: {
  tipoMaterial: string;
  fileMime?: string;
}): string {
  const tipo = String(item.tipoMaterial || "").toLowerCase();

  if (tipo.includes("slide")) return "material:slides";
  if (tipo.includes("prova")) return "material:prova";
  if (tipo.includes("lista")) return "material:lista";
  if (tipo.includes("cruzadinha")) return "material:cruzadinha";
  if (tipo.includes("flashcard")) return "material:flashcards";
  if (tipo.includes("mapa") && tipo.includes("mental")) return "material:mapa-mental";
  if (tipo.includes("jogo")) return "material:jogo";
  if (tipo.includes("apostila")) return "material:apostila";
  if (tipo.includes("atividade")) return "material:atividade";
  if (tipo.includes("plano") && tipo.includes("aula")) return "material:plano-aula";
  if (tipo.includes("resumo")) return "material:resumo";
  if (tipo.includes("sequencia") || tipo.includes("sequência")) return "material:sequencia";
  if (tipo.includes("projeto")) return "material:projeto";
  if (tipo.includes("redacao") || tipo.includes("redação")) return "material:redacao";
  if (tipo.includes("planejamento") || tipo.includes("trimestral") || tipo.includes("anual")) {
    if (tipo.includes("trimestral") || tipo.includes("trimestre")) {
      return "planejamento:trimestral";
    }
    if (tipo.includes("anual")) return "planejamento:anual";
    return "planejamento:anual";
  }

  if (String(item.fileMime || "").includes("pdf")) return "material:pdf";
  return `material:${tipo.replace(/\s+/g, "-") || "apoio"}`;
}
