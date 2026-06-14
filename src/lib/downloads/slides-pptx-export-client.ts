import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  filenameFromContentDisposition,
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";
import type { PlanifySlideExportPayload } from "@/components/google/GoogleSlidesExportButton";

export async function downloadSlidesPptx(params: {
  title: string;
  html?: string;
  slides?: PlanifySlideExportPayload[];
  theme?: string;
  documentType?: string | null;
  fallbackFileName?: string;
}): Promise<void> {
  const response = await planifyAuthenticatedFetch("/api/documentos/export-pptx", {
    method: "POST",
    body: JSON.stringify({
      title: params.title,
      html: params.html ?? "",
      slides: params.slides,
      theme: params.theme,
      documentType: params.documentType ?? null,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error?.message || "Não foi possível baixar a apresentação PPTX.",
    );
  }

  const blob = await readDownloadBlob(response);
  const filename =
    response.headers.get("X-Planify-Filename") ||
    filenameFromContentDisposition(response.headers.get("Content-Disposition")) ||
    params.fallbackFileName ||
    "apresentacao-planify.pptx";

  triggerBrowserDownload(blob, filename);
}
