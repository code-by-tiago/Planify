import { requireGoogleConfig } from "./google-config";

export type DriveUploadResult = {
  fileId: string;
  name: string;
  webViewLink: string | null;
};

export async function uploadBufferToGoogleDrive(params: {
  accessToken: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<DriveUploadResult> {
  const { driveFolderId } = requireGoogleConfig();
  const metadata: Record<string, unknown> = {
    name: params.filename,
  };

  if (driveFolderId) {
    metadata.parents = [driveFolderId];
  }

  const boundary = `planify_${Date.now()}`;
  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`,
    ),
    params.buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );

  const data = (await response.json()) as {
    id?: string;
    name?: string;
    webViewLink?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.id) {
    throw new Error(
      data.error?.message || "Não foi possível enviar o arquivo para o Google Drive.",
    );
  }

  const fileId = data.id;

  return {
    fileId,
    name: data.name || params.filename,
    webViewLink: data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
  };
}

const PPTX_MIME =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/** Envia PPTX e converte para Google Apresentações nativo. */
export async function uploadPptxAsGooglePresentation(params: {
  accessToken: string;
  filename: string;
  buffer: Buffer;
}): Promise<DriveUploadResult> {
  const { driveFolderId } = requireGoogleConfig();
  const baseName = params.filename.replace(/\.pptx$/i, "");
  const metadata: Record<string, unknown> = {
    name: baseName,
    mimeType: "application/vnd.google-apps.presentation",
  };

  if (driveFolderId) {
    metadata.parents = [driveFolderId];
  }

  const boundary = `planify_slides_${Date.now()}`;
  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${PPTX_MIME}\r\n\r\n`),
    params.buffer,
    Buffer.from(`\r\n--${boundary}--`),
  ]);

  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    },
  );

  const data = (await response.json()) as {
    id?: string;
    name?: string;
    webViewLink?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.id) {
    throw new Error(
      data.error?.message ||
        "Não foi possível criar a apresentação no Google Apresentações.",
    );
  }

  const fileId = data.id;
  const presentationUrl = `https://docs.google.com/presentation/d/${fileId}/edit`;

  return {
    fileId,
    name: data.name || baseName,
    webViewLink: data.webViewLink || presentationUrl,
  };
}
