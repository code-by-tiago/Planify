import { normalizeMaterialEstrutura } from "@/lib/materiais/normalize-material-estrutura";
import type { MaterialEngineInput, MaterialEngineResponse } from "./material-engine-types";
import { buildMaterialEngineHtmlFromStructure } from "./material-engine-service";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export type MaterialDocumentoMeta = {
  tipo: string;
  title: string;
  discipline: string | null;
  created_at: string;
};

type GeneratedMaterialRow = {
  id: string;
  user_id: string;
  tipo: string;
  title: string;
  discipline: string | null;
  html_editor: string | null;
  content_html: string | null;
  response_json: unknown;
  request_payload: unknown;
  created_at: string;
};

function pickMeaningfulHtml(...candidates: Array<string | null | undefined>): string {
  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (value) return value;
  }
  return "";
}

function resolveGenerationPayload(row: GeneratedMaterialRow): MaterialEngineInput | null {
  const payload = row.request_payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  return payload as MaterialEngineInput;
}

function resolveHtmlFromStructure(
  row: GeneratedMaterialRow,
): string | null {
  const generationPayload = resolveGenerationPayload(row);
  if (!generationPayload) return null;

  const { estrutura } = normalizeMaterialEstrutura(row.response_json);
  if (!estrutura) return null;

  try {
    return buildMaterialEngineHtmlFromStructure(
      generationPayload,
      estrutura as Partial<MaterialEngineResponse>,
    );
  } catch {
    return null;
  }
}

export async function getMaterialDocumentoForUser(params: {
  userId: string;
  materialId: string;
}): Promise<
  | {
      ok: true;
      html: string;
      meta: MaterialDocumentoMeta;
      source: "html_editor" | "content_html" | "rendered";
    }
  | { ok: false; status: 404 | 403; message: string }
> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("generated_materials")
    .select(
      "id, user_id, tipo, title, discipline, html_editor, content_html, response_json, request_payload, created_at",
    )
    .eq("id", params.materialId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { ok: false, status: 404, message: "Material não encontrado." };
  }

  const row = data as GeneratedMaterialRow;

  if (row.user_id !== params.userId) {
    return { ok: false, status: 403, message: "Acesso negado a este material." };
  }

  const htmlEditor = pickMeaningfulHtml(row.html_editor);
  const contentHtml = pickMeaningfulHtml(row.content_html);
  const renderedHtml = resolveHtmlFromStructure(row) || "";

  const html = htmlEditor || contentHtml || renderedHtml;

  if (!html) {
    return {
      ok: false,
      status: 404,
      message: "Este material não possui HTML recuperável.",
    };
  }

  const source = htmlEditor
    ? "html_editor"
    : contentHtml
      ? "content_html"
      : "rendered";

  return {
    ok: true,
    html,
    source,
    meta: {
      tipo: row.tipo,
      title: row.title,
      discipline: row.discipline,
      created_at: row.created_at,
    },
  };
}
