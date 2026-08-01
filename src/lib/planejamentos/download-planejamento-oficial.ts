/**
 * @deprecated UI removida — exportação de planejamentos é via Google Docs API.
 * Mantido apenas para scripts E2E legados que ainda chamam `/api/planejamentos/docx-oficial`.
 * Usa exclusivamente os modelos oficiais anual/trimestral (sem upload customizado).
 */
import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  filenameFromContentDisposition,
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";

type PlanejamentoPayload = Record<string, unknown>;

export type DownloadPlanejamentoDocxResult = {
  filename: string;
  templateSource: "official";
};

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
): Promise<DownloadPlanejamentoDocxResult> {
  const response = await planifyAuthenticatedFetch("/api/planejamentos/docx-oficial", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  return {
    filename,
    templateSource: "official",
  };
}
