import { fetchMaterialDocumento } from "@/lib/materiais/material-documento-client";
import type { MaterialEditorMeta } from "@/lib/materiais/material-editor-flow";
import type { EditorDocument } from "@/types/editor";
import type { HistoryItem } from "@/types/history";
import type { MaterialEngineInput } from "@/server/materials/material-engine-types";
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";

const DEFAULT_TEMPLATE_MARKERS = [
  "Comece a editar seu material aqui",
  "Documento pedagógico",
];

function stripHtmlToText(html: string): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Reject empty shells, default template and header-only documents. */
export function isMeaningfulEditorHtml(html: string): boolean {
  const trimmed = String(html || "").trim();
  if (!trimmed) return false;

  const text = stripHtmlToText(trimmed);
  if (text.length < 24) return false;

  const looksLikeDefaultTemplate =
    DEFAULT_TEMPLATE_MARKERS.every((marker) => trimmed.includes(marker)) &&
    trimmed.includes("<table") &&
    text.length < 140;

  if (looksLikeDefaultTemplate) return false;

  const headingOnly =
    /^<(?:article|div|section)[^>]*>\s*<h1[^>]*>[\s\S]*?<\/h1>\s*<\/(?:article|div|section)>$/i.test(
      trimmed,
    );

  return !headingOnly;
}

function historyItemToEditorDocument(item: HistoryItem): EditorDocument {
  return {
    id: item.id,
    source: item.source,
    title: item.title,
    subtitle: item.subtitle,
    type: item.type,
    content: item.content,
    raw: item.raw,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

async function rerenderMaterialHtml(params: {
  generationPayload: MaterialEngineInput;
  estrutura: unknown;
}): Promise<string> {
  const response = await planifyAuthenticatedFetch(
    "/api/materiais/render-html",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generationPayload: params.generationPayload,
        estrutura: params.estrutura,
      }),
    },
  );

  const data = (await response.json().catch(() => null)) as {
    ok?: boolean;
    html?: string;
    message?: string;
  } | null;

  if (!response.ok || !data?.ok || !data.html?.trim()) {
    throw new Error(
      data?.message ||
        "Não foi possível reconstruir o HTML deste material a partir da estrutura salva.",
    );
  }

  return data.html;
}

export async function resolveHistoryItemForEditor(
  item: HistoryItem,
): Promise<EditorDocument> {
  if (isMeaningfulEditorHtml(item.content)) {
    return historyItemToEditorDocument(item);
  }

  const raw = (item.raw || {}) as MaterialEditorMeta & Record<string, unknown>;
  const estrutura = raw.estrutura ?? raw;
  const generationPayload = raw.generationPayload;

  if (estrutura && generationPayload) {
    const html = await rerenderMaterialHtml({ generationPayload, estrutura });
    return {
      ...historyItemToEditorDocument(item),
      content: html,
      updatedAt: new Date().toISOString(),
    };
  }

  const serverMaterialId = String(raw.serverMaterialId || "").trim();
  if (serverMaterialId) {
    const documento = await fetchMaterialDocumento(serverMaterialId);
    if (!documento || !documento.ok || !documento.html.trim()) {
      throw new Error(
        (documento && !documento.ok ? documento.message : null) ||
          "Não foi possível recuperar o conteúdo deste material no servidor.",
      );
    }

    return {
      ...historyItemToEditorDocument(item),
      content: documento.html,
      updatedAt: new Date().toISOString(),
    };
  }

  throw new Error(
    "Este item do histórico não possui conteúdo recuperável. Gere o material novamente ou abra outra versão salva.",
  );
}
