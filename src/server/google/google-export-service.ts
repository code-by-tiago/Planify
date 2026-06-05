import { buildEditorExportDocumentHtml } from "../export/editor-html-export-service";
import { buildHtmlAltChunkDocx } from "../docx/simple-docx-builder";
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
};

export async function exportMaterialToGoogle(
  userId: string,
  input: GoogleClassroomExportInput,
): Promise<GoogleClassroomExportResult> {
  const { accessToken, googleEmail } = await getValidGoogleAccessToken(userId);
  const title = String(input.title || "Material Planify").trim() || "Material Planify";

  let buffer = input.docxBuffer;

  if (!buffer) {
    const exportHtml = buildEditorExportDocumentHtml(
      title,
      String(input.html || ""),
    );

    buffer = buildHtmlAltChunkDocx({
      title,
      htmlDocument: exportHtml,
    });
  }

  const filename = `${safeFilename(input.filename || title)}.docx`;
  const drive = await uploadBufferToGoogleDrive({
    accessToken,
    filename,
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  });

  const result: GoogleClassroomExportResult = {
    drive,
    googleEmail,
  };

  if (input.courseId) {
    result.classroom = await publishDriveFileToClassroom({
      accessToken,
      courseId: input.courseId,
      title,
      description: input.description,
      driveFileId: drive.fileId,
    });
  }

  return result;
}
