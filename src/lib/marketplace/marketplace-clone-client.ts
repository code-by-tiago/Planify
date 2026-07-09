import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import { canOpenMarketplaceMaterialInEditor } from "@/lib/marketplace/marketplace-editor-open";
import { upsertHistoryItem } from "@/lib/history/history-storage";
import type { HistoryItem } from "@/types/history";

export type CloneMarketplaceMaterialResult = {
  historyItemId: string;
  title: string;
  html: string;
  downloadsCount: number;
};

export async function cloneMarketplaceMaterialToAccount(materialId: string): Promise<CloneMarketplaceMaterialResult> {
  const response = await planifyAuthenticatedFetch(
    `/api/marketplace/materiais/${materialId}/clone`,
    { method: "POST" },
  );

  const data = (await response.json()) as {
    success?: boolean;
    clone?: {
      historyItemId?: string;
      title?: string;
      html?: string;
      downloadsCount?: number;
    };
    error?: { message?: string };
  };

  if (!response.ok || !data.success || !data.clone?.html || !data.clone.historyItemId) {
    throw new Error(data?.error?.message || "Não foi possível clonar o material.");
  }

  const html = data.clone.html;
  const title = data.clone.title || "Material clonado";
  const historyItemId = data.clone.historyItemId;
  const now = new Date().toISOString();

  const historyItem: HistoryItem = {
    id: historyItemId,
    title,
    subtitle: "Clonado da Comunidade",
    source: "marketplace",
    type: "material:comunidade-clone",
    status: "rascunho",
    contentPreview: html.replace(/<[^>]+>/g, " ").slice(0, 240),
    content: html,
    raw: {
      source: "community_clone",
      marketplaceId: materialId,
      schoolLabel: null,
      classLabel: null,
      folderId: null,
    },
    createdAt: now,
    updatedAt: now,
  };

  upsertHistoryItem(historyItem);

  localStorage.setItem(
    "planify_editor_document",
    JSON.stringify({
      type: "marketplace",
      title,
      html,
      content: html,
      marketplaceId: materialId,
      historyItemId,
      payload: {
        source: "community_clone",
        id: materialId,
        historyItemId,
      },
      updatedAt: now,
    }),
  );
  localStorage.setItem("planify_editor_content", html);

  return {
    historyItemId,
    title,
    html,
    downloadsCount: data.clone.downloadsCount || 0,
  };
}

export async function cloneAndOpenInEditor(materialId: string): Promise<void> {
  await cloneMarketplaceMaterialToAccount(materialId);
  window.location.href = "/editor?from=comunidade&cloned=1";
}

export { canOpenMarketplaceMaterialInEditor };
