import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";

type DocxKind = "material" | "biblioteca" | "marketplace" | "generic";

function safeFileName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 80) || "documento-planify"
  );
}

export async function downloadDocxDocument(
  kind: DocxKind,
  payload: unknown,
  fallbackFilename = "documento-planify",
) {
  const response = await planifyAuthenticatedFetch("/api/documentos/docx", {
    method: "POST",
    body: JSON.stringify({
      kind,
      document: payload,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.error?.message || "Não foi possível baixar o DOCX agora.",
    );
  }

  const blob = await readDownloadBlob(response);
  const headerName = response.headers.get("X-Planify-Filename");
  const filename = headerName || `${safeFileName(fallbackFilename)}.docx`;

  triggerBrowserDownload(blob, filename);
}
