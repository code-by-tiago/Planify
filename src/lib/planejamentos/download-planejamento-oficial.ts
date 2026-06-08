import { planifyAuthenticatedFetch } from "@/lib/auth/authenticated-fetch";
import {
  filenameFromContentDisposition,
  readDownloadBlob,
  triggerBrowserDownload,
} from "@/lib/downloads/trigger-browser-download";

type PlanejamentoPayload = Record<string, unknown>;

export type DownloadPlanejamentoDocxOptions = {
  customTemplateFile?: File | null;
};

export type DownloadPlanejamentoDocxResult = {
  filename: string;
  usedFallback: boolean;
  fallbackMessage?: string;
  templateSource: "official" | "custom";
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

function validateClientTemplateFile(file: File): void {
  if (!file.name.toLowerCase().endsWith(".docx")) {
    throw new Error("Envie apenas arquivos com extensão .docx.");
  }

  const maxBytes = 10 * 1024 * 1024;

  if (file.size > maxBytes) {
    throw new Error("O modelo da escola deve ter no máximo 10 MB.");
  }
}

export async function downloadPlanejamentoOficialDocx(
  payload: PlanejamentoPayload,
  fallbackFilename = "planejamento-planify",
  options: DownloadPlanejamentoDocxOptions = {},
): Promise<DownloadPlanejamentoDocxResult> {
  const customTemplateFile = options.customTemplateFile;

  let response: Response;

  if (customTemplateFile) {
    validateClientTemplateFile(customTemplateFile);

    const body = new FormData();
    body.set("payload", JSON.stringify(payload));
    body.set("template", customTemplateFile);

    response = await planifyAuthenticatedFetch("/api/planejamentos/docx-oficial", {
      method: "POST",
      body,
    });
  } else {
    response = await planifyAuthenticatedFetch("/api/planejamentos/docx-oficial", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

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

  const usedFallback = response.headers.get("X-Planify-Template-Fallback") === "true";
  const fallbackMessage = response.headers.get("X-Planify-Template-Message") || undefined;
  const templateSource =
    response.headers.get("X-Planify-Template-Source") === "custom" ? "custom" : "official";

  return {
    filename,
    usedFallback,
    fallbackMessage,
    templateSource,
  };
}
