import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  filenameFromContentDisposition,
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";

type PlanejamentoPayload = Record<string, unknown>;

function safeFileName(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 90) || "planejamento-planify"
  );
}

export async function downloadPlanejamentoOficialDocx(
  payload: PlanejamentoPayload,
  fallbackFilename = "planejamento-planify",
) {
  const response = await planifyAuthenticatedFetch("/api/planejamentos/docx-oficial", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.error?.message ||
        error?.message ||
        "Não foi possível baixar o planejamento DOCX.",
    );
  }

  const blob = await readDownloadBlob(response);
  const filename =
    response.headers.get("X-Planify-Filename") ||
    filenameFromContentDisposition(response.headers.get("Content-Disposition")) ||
    `${safeFileName(fallbackFilename)}.docx`;

  triggerBrowserDownload(blob, filename);
}
