import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  filenameFromContentDisposition,
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";

export type MarketplaceDownloadFormat = "docx" | "pdf" | "html";

export type MarketplaceFeedFileType = "pdf" | "docx" | "pptx" | "image";

export function resolveMarketplaceDownloadParams(material: {
  title: string;
  fileType: MarketplaceFeedFileType;
  fileName?: string | null;
}): {
  format: MarketplaceDownloadFormat;
  fallbackFileName: string;
} {
  const extensionByType: Record<MarketplaceFeedFileType, string> = {
    pdf: "pdf",
    docx: "docx",
    pptx: "pptx",
    image: "png",
  };

  const fallbackFileName =
    material.fileName?.trim() ||
    `${material.title}.${extensionByType[material.fileType]}`;

  if (material.fileType === "pdf") {
    return { format: "pdf", fallbackFileName };
  }

  if (material.fileType === "docx") {
    return { format: "docx", fallbackFileName };
  }

  // PPTX/imagens: formato "html" entrega o arquivo original no servidor.
  return { format: "html", fallbackFileName };
}

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
