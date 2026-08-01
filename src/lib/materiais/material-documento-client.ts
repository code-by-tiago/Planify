import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import type { MaterialDocumentoMeta } from "@/server/materials/material-documento-service";

export type FetchMaterialDocumentoResult = {
  ok: true;
  html: string;
  source: "html_editor" | "content_html" | "rendered";
  meta: MaterialDocumentoMeta;
};

export type FetchMaterialDocumentoFailure = {
  ok: false;
  message: string;
};

export async function fetchMaterialDocumento(
  materialId: string,
): Promise<FetchMaterialDocumentoResult | FetchMaterialDocumentoFailure | null> {
  const id = String(materialId || "").trim();
  if (!id) return null;

  const response = await planifyAuthenticatedFetch(
    `/api/materiais/${encodeURIComponent(id)}/documento`,
    { method: "GET" },
  );

  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok || !data.html) {
    return {
      ok: false,
      message:
        data?.message ||
        "Não foi possível recuperar o documento deste material.",
    };
  }

  return {
    ok: true,
    html: String(data.html),
    source: data.source,
    meta: data.meta as MaterialDocumentoMeta,
  };
}
