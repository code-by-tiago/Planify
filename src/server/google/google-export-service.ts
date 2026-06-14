import { resolveClassroomExportForHtml } from "@/lib/export/classroom-export-format";
import { exportEditorHtmlDocument } from "../export/editor-html-export-service";
import { publishDriveFileToClassroom } from "./google-classroom";
import { uploadBufferToGoogleDrive } from "./google-drive";
import { getValidGoogleAccessToken } from "./google-token-store";

function safeFilename(value: string): string {
  const cleaned = String(value || "material-planify")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return cleaned || "material-planify";
}

export type GoogleClassroomExportInput = {
  title: string;
  html?: string;
  description?: string;
  courseId?: string;
  docxBuffer?: Buffer;
  filename?: string;
  /** Tipo salvo no documento (ex.: material:slides) — reforça a detecção no servidor. */
  documentType?: string | null;
  publishState?: "PUBLISHED" | "DRAFT";
};

export type GoogleClassroomExportResult = {
  drive: {
    fileId: string;
    name: string;
    webViewLink: string | null;
  };
  classroom?: {
    courseWorkId: string;
    alternateLink: string | null;
  };
  googleEmail: string | null;
  exportFormat: "pdf" | "docx";
};

export async function exportMaterialToGoogle(
  userId: string,
  input: GoogleClassroomExportInput,
): Promise<GoogleClassroomExportResult> {
  const { accessToken, googleEmail } = await getValidGoogleAccessToken(userId);
  const title = String(input.title || "Material Planify").trim() || "Material Planify";

  let buffer = input.docxBuffer;
  let filename = `${safeFilename(input.filename || title)}.docx`;
  let mimeType =
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  let exportFormat: "pdf" | "docx" = "docx";

  if (!buffer) {
    const html = String(input.html || "");
    const format = resolveClassroomExportForHtml(html, input.documentType);
    const exported = await exportEditorHtmlDocument({
      title,
      html,
      format,
      documentType: input.documentType,
    });

    buffer = exported.buffer;
    filename = exported.filename;
    mimeType = exported.contentType;
    exportFormat = format;
  }

  const drive = await uploadBufferToGoogleDrive({
    accessToken,
    filename,
    mimeType,
    buffer,
  });

  const result: GoogleClassroomExportResult = {
    drive,
    googleEmail,
    exportFormat,
  };

  if (input.courseId) {
    result.classroom = await publishDriveFileToClassroom({
      accessToken,
      courseId: input.courseId,
      title,
      description: input.description,
      driveFileId: drive.fileId,
      publishState: input.publishState,
    });
  }

  return result;
}
