import { buildEditorExportDocumentHtml } from "../export/editor-html-export-service";
import { buildHtmlAltChunkDocx } from "../docx/simple-docx-builder";
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

function buildDocxBuffer(title: string, html: string): Buffer {
  const exportHtml = buildEditorExportDocumentHtml(title, html);
  return buildHtmlAltChunkDocx({
    title,
    htmlDocument: exportHtml,
  });
}

export type GoogleDocsExportInput = {
  title: string;
  html: string;
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

  const buffer = buildDocxBuffer(title, html);
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

  const buffer = buildDocxBuffer(title, html);
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
