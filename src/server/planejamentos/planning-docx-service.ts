import { NextRequest } from "next/server";
import {
  buildOfficialPlanningDocx,
  getOfficialPlanningFilename,
  type OfficialPlanningPayload,
} from "./official-planning-docx";

export type PlanningDocxBuildResult = {
  buffer: Buffer;
  filename: string;
};

const OFFICIAL_ONLY_MESSAGE =
  "O Planify usa exclusivamente os modelos oficiais anual e trimestral. Upload de modelos customizados não é suportado.";

function ensurePayloadHasMatrix(payload: OfficialPlanningPayload): void {
  if (!payload.matrizPlanejamento?.conteudos?.length) {
    throw new Error(
      "Gere o planejamento com IA antes de exportar. O Planify não preenche o modelo oficial sem matriz pedagógica.",
    );
  }
}

export async function parsePlanningDocxRequest(
  request: NextRequest,
): Promise<OfficialPlanningPayload> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      throw new Error("Não foi possível ler os dados enviados.");
    }

    if (formData.get("template")) {
      throw new Error(OFFICIAL_ONLY_MESSAGE);
    }

    const payloadRaw = formData.get("payload");

    if (typeof payloadRaw !== "string" || !payloadRaw.trim()) {
      throw new Error("Dados do planejamento ausentes na requisição.");
    }

    try {
      return JSON.parse(payloadRaw) as OfficialPlanningPayload;
    } catch {
      throw new Error("Dados do planejamento inválidos.");
    }
  }

  return (await request.json()) as OfficialPlanningPayload;
}

export function buildPlanningDocx(payload: OfficialPlanningPayload): PlanningDocxBuildResult {
  ensurePayloadHasMatrix(payload);

  return {
    buffer: buildOfficialPlanningDocx(payload),
    filename: getOfficialPlanningFilename(payload),
  };
}
