import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  filenameFromContentDisposition,
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";

export type MarketplaceDownloadFormat = "docx" | "pdf" | "html";

export async function downloadMarketplaceMaterial(params: {
  id: string;
  format?: MarketplaceDownloadFormat;
  fallbackFileName?: string;
}): Promise<void> {
  const format = params.format || "docx";
  const query = new URLSearchParams({ format });

  const response = await planifyAuthenticatedFetch(
    `/api/marketplace/materiais/${params.id}/download?${query.toString()}`,
    { method: "GET" },
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(
      data?.error?.message || "Não foi possível baixar o material.",
    );
  }

  const blob = await readDownloadBlob(response);
  const filename =
    response.headers.get("X-Planify-Filename") ||
    filenameFromContentDisposition(response.headers.get("Content-Disposition")) ||
    params.fallbackFileName ||
    `material-planify.${format}`;

  triggerBrowserDownload(blob, filename);
}
