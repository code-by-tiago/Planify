import { NextRequest } from "next/server";
import {
  buildOfficialPlanningDocx,
  getOfficialPlanningFilename,
  type OfficialPlanningPayload,
} from "./official-planning-docx";
import {
  CUSTOM_TEMPLATE_ALLOWED_EXTENSION,
  CUSTOM_TEMPLATE_ALLOWED_MIME_TYPES,
  CUSTOM_TEMPLATE_FALLBACK_MESSAGE,
  CUSTOM_TEMPLATE_MAX_BYTES,
} from "./planning-docx-constants";
import { buildUniversalPlanningDocx, validateCustomDocxBuffer } from "./universal-planning-docx";

export type PlanningDocxBuildResult = {
  buffer: Buffer;
  filename: string;
  templateSource: "official" | "custom";
  usedFallback: boolean;
  fallbackMessage?: string;
};

function hasDocxExtension(filename: string): boolean {
  return filename.toLowerCase().endsWith(CUSTOM_TEMPLATE_ALLOWED_EXTENSION);
}

type TemplateUpload = File | (Blob & { name?: string });

function getUploadFileName(file: TemplateUpload): string {
  if (file instanceof File) {
    return file.name;
  }

  return String(file.name || "modelo.docx");
}

function isTemplateUpload(value: unknown): value is TemplateUpload {
  if (!(value instanceof Blob) || value.size <= 0) {
    return false;
  }

  return hasDocxExtension(getUploadFileName(value as TemplateUpload));
}

export function validateCustomTemplateUpload(file: TemplateUpload): string | null {
  if (!(file instanceof Blob) || !file.size) {
    return "Selecione um arquivo .docx válido.";
  }

  if (file.size > CUSTOM_TEMPLATE_MAX_BYTES) {
    return "O modelo da escola deve ter no máximo 10 MB.";
  }

  if (!hasDocxExtension(getUploadFileName(file))) {
    return "Envie apenas arquivos com extensão .docx.";
  }

  const mime = (file.type || "").toLowerCase();

  if (mime && !CUSTOM_TEMPLATE_ALLOWED_MIME_TYPES.has(mime)) {
    return "Envie apenas arquivos .docx.";
  }

  return null;
}

async function readCustomTemplateBuffer(file: TemplateUpload): Promise<Buffer> {
  const validationError = validateCustomTemplateUpload(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  validateCustomDocxBuffer(buffer, CUSTOM_TEMPLATE_MAX_BYTES);

  return buffer;
}

function ensurePayloadHasMatrix(payload: OfficialPlanningPayload): void {
  if (!payload.matrizPlanejamento?.conteudos?.length) {
    throw new Error(
      "Gere o planejamento com IA antes de exportar. O Planify não preenche o modelo oficial sem matriz pedagógica.",
    );
  }
}

export async function parsePlanningDocxRequest(
  request: NextRequest,
): Promise<{ payload: OfficialPlanningPayload; customTemplate?: Buffer }> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      throw new Error("Não foi possível ler o arquivo enviado.");
    }

    const payloadRaw = formData.get("payload");

    if (typeof payloadRaw !== "string" || !payloadRaw.trim()) {
      throw new Error("Dados do planejamento ausentes na requisição.");
    }

    let payload: OfficialPlanningPayload;

    try {
      payload = JSON.parse(payloadRaw) as OfficialPlanningPayload;
    } catch {
      throw new Error("Dados do planejamento inválidos.");
    }

    const templateValue = formData.get("template");

    if (!templateValue) {
      return { payload };
    }

    if (!isTemplateUpload(templateValue)) {
      throw new Error("Arquivo de modelo inválido.");
    }

    const customTemplate = await readCustomTemplateBuffer(templateValue);
    return { payload, customTemplate };
  }

  const payload = (await request.json()) as OfficialPlanningPayload;
  return { payload };
}

export function buildPlanningDocx(
  payload: OfficialPlanningPayload,
  customTemplate?: Buffer,
): PlanningDocxBuildResult {
  ensurePayloadHasMatrix(payload);

  const filename = getOfficialPlanningFilename(payload);

  if (!customTemplate) {
    return {
      buffer: buildOfficialPlanningDocx(payload),
      filename,
      templateSource: "official",
      usedFallback: false,
    };
  }

  try {
    const universal = buildUniversalPlanningDocx(customTemplate, payload);

    if (universal.success) {
      return {
        buffer: universal.buffer,
        filename,
        templateSource: "custom",
        usedFallback: false,
      };
    }
  } catch {
    // segue para fallback oficial
  }

  return {
    buffer: buildOfficialPlanningDocx(payload),
    filename,
    templateSource: "official",
    usedFallback: true,
    fallbackMessage: CUSTOM_TEMPLATE_FALLBACK_MESSAGE,
  };
}
