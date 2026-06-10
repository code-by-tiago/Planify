import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";

export type MarketplaceEditorOpenItem = {
  id: string;
  title: string;
  description?: string;
  etapa?: string;
  anoSerie?: string;
  componente?: string;
  tipoMaterial?: string;
  tema?: string;
  fileName?: string;
  fileMime?: string;
};

export function canOpenMarketplaceMaterialInEditor(item: {
  fileName?: string;
  fileMime?: string;
}): boolean {
  const name = String(item.fileName || "").toLowerCase();
  const mime = String(item.fileMime || "").toLowerCase();

  if (
    name.endsWith(".html") ||
    name.endsWith(".htm") ||
    mime.includes("html") ||
    mime === "text/plain"
  ) {
    return true;
  }

  if (
    name.endsWith(".docx") ||
    name.endsWith(".doc") ||
    mime.includes("wordprocessingml") ||
    mime.includes("msword")
  ) {
    return true;
  }

  return false;
}

function buildFallbackHtml(item: MarketplaceEditorOpenItem): string {
  return `
    <article class="planify-doc" style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h1>${item.title}</h1>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Etapa</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.etapa || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Ano/Série</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.anoSerie || "Geral"}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Componente</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.componente || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Tipo</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.tipoMaterial || ""}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px;"><strong>Tema</strong></td><td style="border:1px solid #cbd5e1;padding:8px;">${item.tema || ""}</td></tr>
      </table>
      <h2>Descrição pedagógica</h2>
      <p>${item.description || ""}</p>
    </article>
  `;
}

export async function openMarketplaceMaterialInEditor(
  item: MarketplaceEditorOpenItem,
): Promise<void> {
  let html = buildFallbackHtml(item);
  let title = item.title;

  const response = await planifyAuthenticatedFetch(
    `/api/marketplace/materiais/${item.id}/preview`,
    { method: "GET" },
  );

  const data = (await response.json()) as {
    success?: boolean;
    material?: { title?: string };
    preview?: {
      kind?: string;
      htmlContent?: string | null;
    };
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data?.error?.message || "Não foi possível abrir no editor.");
  }

  const previewKind = data.preview?.kind;
  const previewHtml = data.preview?.htmlContent?.trim();

  if (previewHtml) {
    html = previewHtml;
    title = data.material?.title || item.title;
  } else if (previewKind === "pdf" || previewKind === "binary") {
    throw new Error(
      "Abrir no editor disponível para DOCX e HTML. Use Baixar para outros formatos.",
    );
  }

  localStorage.setItem(
    "planify_editor_document",
    JSON.stringify({
      type: "marketplace",
      title,
      html,
      content: html,
      marketplaceId: item.id,
      payload: {
        source: "marketplace",
        id: item.id,
      },
      updatedAt: new Date().toISOString(),
    }),
  );

  localStorage.setItem("planify_editor_content", html);
  window.location.href = "/editor?from=marketplace";
}
