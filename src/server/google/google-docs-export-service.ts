import { resolvePreparedExportBody } from "../export/editor-html-export-service";
import { buildNativeHtmlDocx } from "../docx/simple-docx-builder";
import {
  buildOfficialPlanningDocx,
  normalizeOfficialPlanningPayload,
  type OfficialPlanningPayload,
} from "../planejamentos/official-planning-docx";
import { uploadBufferToGoogleDrive, uploadDocxAsGoogleDocument } from "./google-drive";
import { getValidGoogleAccessToken } from "./google-token-store";

function safeFilename(value: string): string {
  const cleaned = String(value || "documento-planify")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return cleaned || "documento-planify";
}

function hasPlanningMatrix(payload: OfficialPlanningPayload): boolean {
  const conteudos = payload.matrizPlanejamento?.conteudos;
  return Array.isArray(conteudos) && conteudos.length > 0;
}

function normalizePlanningPayload(
  payload: OfficialPlanningPayload | Record<string, unknown> | null | undefined,
): OfficialPlanningPayload | null {
  if (!payload || typeof payload !== "object") return null;
  return payload as OfficialPlanningPayload;
}

function isPlanningDocumentType(documentType?: string | null): boolean {
  return String(documentType || "").toLowerCase().includes("planejamento");
}

function isTrimestralPlanningDocumentType(documentType?: string | null): boolean {
  const type = String(documentType || "").toLowerCase();
  return type.includes("trimestral") || type.includes("trimestre");
}

function buildDocxBuffer(
  title: string,
  html: string,
  documentType?: string | null,
  planningPayload?: OfficialPlanningPayload | Record<string, unknown> | null,
): { buffer: Buffer; exportEngine: "official" | "html" } {
  const normalizedPlanning = normalizePlanningPayload(planningPayload);
  const requiresOfficialTemplate =
    isPlanningDocumentType(documentType) ||
    Boolean(normalizedPlanning && hasPlanningMatrix(normalizedPlanning));

  if (requiresOfficialTemplate) {
    if (!normalizedPlanning || !hasPlanningMatrix(normalizedPlanning)) {
      throw new Error(
        "Matriz do planejamento não encontrada. Gere o planejamento com IA antes de exportar — o Planify usa exclusivamente os modelos oficiais anual/trimestral.",
      );
    }

    const documentId =
      typeof (normalizedPlanning as { documentId?: unknown }).documentId === "string"
        ? (normalizedPlanning as { documentId: string }).documentId
        : null;

    const officialPayload = normalizeOfficialPlanningPayload(
      normalizedPlanning,
      documentType,
      documentId,
    );

    if (
      isTrimestralPlanningDocumentType(documentType) &&
      !String(officialPayload.tipoPlanejamento || "")
        .toLowerCase()
        .includes("tri")
    ) {
      throw new Error(
        "Exportação trimestral inconsistente: o Planify exige modelo-trimestral.docx para abas trimestrais.",
      );
    }

    return {
      buffer: buildOfficialPlanningDocx(officialPayload, {
        documentType,
        documentId: documentId ?? undefined,
      }),
      exportEngine: "official",
    };
  }

  const htmlBody = resolvePreparedExportBody(html, documentType, "docx");

  return {
    buffer: buildNativeHtmlDocx({
      title,
      htmlBody,
    }),
    exportEngine: "html",
  };
}

export type GoogleDocsExportInput = {
  title: string;
  html: string;
  documentType?: string | null;
  planningPayload?: OfficialPlanningPayload | Record<string, unknown> | null;
};

export type GoogleDocsExportResult = {
  drive: {
    fileId: string;
    name: string;
    webViewLink: string | null;
  };
  documentUrl: string;
  googleEmail: string | null;
  exportEngine?: "official" | "html";
};

export async function exportDocumentToGoogleDocs(
  userId: string,
  input: GoogleDocsExportInput,
): Promise<GoogleDocsExportResult> {
  const { accessToken, googleEmail } = await getValidGoogleAccessToken(userId);
  const title = String(input.title || "Documento Planify").trim() || "Documento Planify";
  const html = String(input.html || "").trim();

  if (!html) {
    throw new Error("Conteúdo do documento vazio.");
  }

  const { buffer, exportEngine } = buildDocxBuffer(
    title,
    html,
    input.documentType,
    input.planningPayload,
  );
  const filename = `${safeFilename(title)}.docx`;

  const drive = await uploadDocxAsGoogleDocument({
    accessToken,
    filename,
    buffer,
  });

  const documentUrl =
    drive.webViewLink?.includes("docs.google.com/document") ||
    drive.webViewLink?.includes("/document/")
      ? drive.webViewLink
      : `https://docs.google.com/document/d/${drive.fileId}/edit`;

  return {
    drive: { ...drive, webViewLink: documentUrl },
    documentUrl,
    googleEmail,
    exportEngine,
  };
}

export type GoogleDriveSaveInput = {
  title: string;
  html: string;
  documentType?: string | null;
  planningPayload?: OfficialPlanningPayload | Record<string, unknown> | null;
};

export type GoogleDriveSaveResult = {
  drive: {
    fileId: string;
    name: string;
    webViewLink: string | null;
  };
  googleEmail: string | null;
  exportEngine?: "official" | "html";
};

/** Salva DOCX no Drive (sem converter para Google Docs). */
export async function saveDocumentToGoogleDrive(
  userId: string,
  input: GoogleDriveSaveInput,
): Promise<GoogleDriveSaveResult> {
  const { accessToken, googleEmail } = await getValidGoogleAccessToken(userId);
  const title = String(input.title || "Documento Planify").trim() || "Documento Planify";
  const html = String(input.html || "").trim();

  if (!html) {
    throw new Error("Conteúdo do documento vazio.");
  }

  const { buffer, exportEngine } = buildDocxBuffer(
    title,
    html,
    input.documentType,
    input.planningPayload,
  );
  const filename = `${safeFilename(title)}.docx`;

  const drive = await uploadBufferToGoogleDrive({
    accessToken,
    filename,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  });

  return { drive, googleEmail, exportEngine };
}
