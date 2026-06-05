import { normalizeDocxPayload } from "../docx/document-normalizer";
import { buildSimpleDocx } from "../docx/simple-docx-builder";
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

function htmlToPlainSections(html: string): Array<{ title: string; content: string }> {
  const text = String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!text) {
    return [{ title: "Conteúdo", content: "Documento sem conteúdo." }];
  }

  const chunks = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);

  if (chunks.length <= 1) {
    return [{ title: "Conteúdo", content: text }];
  }

  return chunks.map((chunk, index) => ({
    title: `Seção ${index + 1}`,
    content: chunk,
  }));
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
    const spec = normalizeDocxPayload({
      kind: "generic",
      document: {
        title,
        subtitle: "Enviado pelo Planify",
        badge: "Planify",
        sections: htmlToPlainSections(String(input.html || "")),
        filename: safeFilename(input.filename || title),
      },
    });

    buffer = Buffer.from(buildSimpleDocx(spec));
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
