import { resolveClassroomExportForHtml } from "@/lib/export/classroom-export-format";
import { exportEditorHtmlDocument } from "../export/editor-html-export-service";
import { GOOGLE_CLASSROOM_REQUIRED_SCOPES } from "./google-config";
import {
  publishDriveFileToClassroom,
  type ClassroomAssignmentOptions,
  type ClassroomPublishResult,
  type ClassroomShareType,
} from "./google-classroom";
import { uploadBufferToGoogleDrive } from "./google-drive";
import { getValidGoogleAccessTokenForScopes } from "./google-token-store";

export const GOOGLE_CLASSROOM_HOME_URL = "https://classroom.google.com";

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
  courseIds?: string[];
  shareType?: ClassroomShareType;
  assignment?: ClassroomAssignmentOptions;
  docxBuffer?: Buffer;
  filename?: string;
  /** Tipo salvo no documento (ex.: material:slides) - reforca a deteccao no servidor. */
  documentType?: string | null;
};

export type GoogleClassroomExportResult = {
  drive: {
    fileId: string;
    name: string;
    webViewLink: string | null;
  };
  classroom: {
    publications: ClassroomPublishResult[];
    errors: { courseId: string; message: string }[];
    type: ClassroomShareType;
  };
  openUrl: string;
  googleEmail: string | null;
  exportFormat: "pdf" | "docx";
};

function normalizeCourseIds(input: GoogleClassroomExportInput): string[] {
  const values = [
    ...(Array.isArray(input.courseIds) ? input.courseIds : []),
    input.courseId,
  ];

  return [
    ...new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ];
}

export async function exportMaterialToGoogle(
  userId: string,
  input: GoogleClassroomExportInput,
): Promise<GoogleClassroomExportResult> {
  const courseIds = normalizeCourseIds(input);

  if (courseIds.length === 0) {
    throw new Error("Selecione ao menos uma turma do Google Classroom antes de publicar.");
  }

  const { accessToken, googleEmail } = await getValidGoogleAccessTokenForScopes(
    userId,
    GOOGLE_CLASSROOM_REQUIRED_SCOPES,
    "Google Classroom",
  );
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
  const publications: ClassroomPublishResult[] = [];
  const errors: { courseId: string; message: string }[] = [];
  const shareType: ClassroomShareType =
    input.shareType === "assignment" ? "assignment" : "material";

  for (const courseId of courseIds) {
    try {
      const publication = await publishDriveFileToClassroom({
        accessToken,
        courseId,
        title,
        description: input.description,
        driveFileId: drive.fileId,
        shareType,
        assignment: input.assignment,
      });
      publications.push(publication);
    } catch (error) {
      errors.push({
        courseId,
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel publicar nesta turma.",
      });
    }
  }

  if (publications.length === 0) {
    throw new Error(errors[0]?.message || "Nao foi possivel publicar no Classroom.");
  }

  return {
    drive,
    classroom: {
      publications,
      errors,
      type: shareType,
    },
    openUrl: publications[0]?.alternateLink || GOOGLE_CLASSROOM_HOME_URL,
    googleEmail,
    exportFormat,
  };
}
