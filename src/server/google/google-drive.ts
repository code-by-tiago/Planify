import { requireGoogleConfig } from "./google-config";

export type DriveUploadResult = {
  fileId: string;
  name: string;
  webViewLink: string | null;
};

/** Opens Google Drive UI (folder or My Drive), not a Docs preview. */
export function buildGoogleDriveDestinationUrl(folderId?: string | null): string {
  const id = String(folderId || "").trim();
  if (id) {
    return `https://drive.google.com/drive/folders/${id}`;
  }
  return "https://drive.google.com/drive/my-drive";
}

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
const GOOGLE_PRESENTATION_MIME = "application/vnd.google-apps.presentation";
const GOOGLE_PRESENTATION_UPLOAD_TIMEOUT_MS = 90_000;

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
    mimeType: GOOGLE_PRESENTATION_MIME,
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
    Buffer.from(`\r\n--${boundary}--\r\n`),
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
      signal: AbortSignal.timeout(GOOGLE_PRESENTATION_UPLOAD_TIMEOUT_MS),
    },
  );

  const data = (await response.json()) as {
    id?: string;
    name?: string;
    webViewLink?: string;
    mimeType?: string;
    error?: { message?: string };
  };

  if (!response.ok || !data.id) {
    throw new Error(
      data.error?.message ||
        "Não foi possível criar a apresentação no Google Apresentações.",
    );
  }

  if (data.mimeType !== GOOGLE_PRESENTATION_MIME) {
    throw new Error(
      "O Google Drive não confirmou a conversão para Google Apresentações. Tente novamente.",
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

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";
const GOOGLE_DOCUMENT_MIME = "application/vnd.google-apps.document";

/** Envia DOCX/DOC e converte para Google Docs nativo (arquivo original). */
export async function uploadDocxAsGoogleDocument(params: {
  accessToken: string;
  filename: string;
  buffer: Buffer;
  sourceMimeType?: string | null;
}): Promise<DriveUploadResult> {
  const { driveFolderId } = requireGoogleConfig();
  const lowerName = params.filename.toLowerCase();
  const isLegacyDoc =
    lowerName.endsWith(".doc") && !lowerName.endsWith(".docx");
  const sourceMime =
    params.sourceMimeType ||
    (isLegacyDoc ? DOC_MIME : DOCX_MIME);
  const baseName = params.filename.replace(/\.docx?$/i, "");
  const metadata: Record<string, unknown> = {
    name: baseName,
    mimeType: GOOGLE_DOCUMENT_MIME,
  };

  if (driveFolderId) {
    metadata.parents = [driveFolderId];
  }

  const boundary = `planify_docs_${Date.now()}`;
  const multipartBody = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
    ),
    Buffer.from(`--${boundary}\r\nContent-Type: ${sourceMime}\r\n\r\n`),
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
        "Não foi possível criar o documento no Google Docs.",
    );
  }

  const fileId = data.id;
  const documentUrl = `https://docs.google.com/document/d/${fileId}/edit`;

  return {
    fileId,
    name: data.name || baseName,
    webViewLink: data.webViewLink || documentUrl,
  };
}

export type DriveDownloadedFile = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

const GOOGLE_NATIVE_EXPORT: Record<string, { mimeType: string; extension: string }> = {
  "application/vnd.google-apps.document": {
    mimeType: DOCX_MIME,
    extension: ".docx",
  },
  "application/vnd.google-apps.spreadsheet": {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: ".xlsx",
  },
  "application/vnd.google-apps.presentation": {
    mimeType: PPTX_MIME,
    extension: ".pptx",
  },
  "application/vnd.google-apps.drawing": {
    mimeType: "image/png",
    extension: ".png",
  },
};

/** Baixa arquivo do Drive (binário) ou exporta Google Docs/Slides nativos. */
export async function downloadDriveFile(params: {
  accessToken: string;
  fileId: string;
  filename?: string | null;
  mimeType?: string | null;
}): Promise<DriveDownloadedFile> {
  const fileId = String(params.fileId || "").trim();
  if (!fileId) throw new Error("Arquivo do Drive não informado.");

  const authHeaders = { Authorization: `Bearer ${params.accessToken}` };
  const metaResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,mimeType&supportsAllDrives=true`,
    { headers: authHeaders },
  );
  const meta = (await metaResponse.json()) as {
    id?: string;
    name?: string;
    mimeType?: string;
    error?: { message?: string; code?: number };
  };
  if (!metaResponse.ok || !meta.id) {
    const msg = meta.error?.message || "Não foi possível ler o arquivo no Drive.";
    if (/not found|404/i.test(msg)) {
      throw new Error(
        "Arquivo não acessível. Feche e abra o Drive de novo (o Planify precisa da permissão do arquivo escolhido).",
      );
    }
    throw new Error(msg);
  }

  const sourceMime = String(meta.mimeType || params.mimeType || "").trim();
  const sourceName = String(meta.name || params.filename || "arquivo").trim();
  const nativeExport = GOOGLE_NATIVE_EXPORT[sourceMime];

  let downloadUrl: string;
  let mimeType: string;
  let filename: string;

  if (nativeExport) {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent(nativeExport.mimeType)}`;
    mimeType = nativeExport.mimeType;
    filename = sourceName.replace(/\.[^.]+$/, "") + nativeExport.extension;
  } else {
    downloadUrl = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;
    mimeType = sourceMime || "application/octet-stream";
    filename = sourceName;
  }

  const fileResponse = await fetch(downloadUrl, { headers: authHeaders });

  if (!fileResponse.ok) {
    const errJson = (await fileResponse.json().catch(() => null)) as {
      error?: { message?: string };
    } | null;
    const errText = errJson?.error?.message || (await fileResponse.text().catch(() => ""));
    if (/not found|404/i.test(String(errText))) {
      throw new Error(
        "Arquivo não acessível. Escolha o arquivo novamente no Drive.",
      );
    }
    throw new Error(
      errText || "Não foi possível baixar o arquivo do Google Drive.",
    );
  }

  const arrayBuffer = await fileResponse.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    filename,
    mimeType,
  };
}
