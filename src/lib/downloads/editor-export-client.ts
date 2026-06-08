import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  filenameFromContentDisposition,
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";

export type EditorExportFormat = "docx" | "pdf" | "html";

export async function downloadEditorExport(params: {
  title: string;
  html: string;
  format: EditorExportFormat;
  fallbackFileName?: string;
  documentType?: string | null;
}): Promise<void> {
  const response = await planifyAuthenticatedFetch("/api/documentos/export", {
    method: "POST",
    body: JSON.stringify({
      title: params.title,
      html: params.html,
      format: params.format,
      documentType: params.documentType ?? null,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error?.message || "Não foi possível exportar o documento.",
    );
  }

  const blob = await readDownloadBlob(response);
  const filename =
    response.headers.get("X-Planify-Filename") ||
    filenameFromContentDisposition(response.headers.get("Content-Disposition")) ||
    params.fallbackFileName ||
    `documento-planify.${params.format}`;

  triggerBrowserDownload(blob, filename);
}
