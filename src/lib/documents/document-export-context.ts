import { historyItemContentToHtml } from "@/lib/history/history-preview";
import { resolvePlanningPayloadForGoogleExport } from "@/lib/planejamentos/planning-google-export-payload";
import type { HistoryItem } from "@/types/history";

export function resolveDocumentTypeFromHistoryItem(item: HistoryItem): string {
  return item.type || "editor";
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
  if (tipo.includes("jogo")) return "material:jogo";
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
