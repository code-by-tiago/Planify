import { detectMaterialExportKind } from "@/lib/export/classroom-export-format";
import { resolvePreparedExportBody } from "../export/editor-html-export-service";
import { buildNativeHtmlDocx } from "../docx/simple-docx-builder";
import {
  buildOfficialPlanningDocx,
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

function buildDocxBuffer(
  title: string,
  html: string,
  documentType?: string | null,
  planningPayload?: OfficialPlanningPayload | Record<string, unknown> | null,
): Buffer {
  const kind = detectMaterialExportKind(html, documentType);
  const normalizedPlanning = normalizePlanningPayload(planningPayload);

  if (
    kind === "planejamento" &&
    normalizedPlanning &&
    hasPlanningMatrix(normalizedPlanning)
  ) {
    return buildOfficialPlanningDocx(normalizedPlanning);
  }

  const htmlBody = resolvePreparedExportBody(html, documentType, "docx");

  return buildNativeHtmlDocx({
    title,
    htmlBody,
  });
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

  const buffer = buildDocxBuffer(
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

  const buffer = buildDocxBuffer(
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

  return { drive, googleEmail };
}
