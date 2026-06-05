import {
  MATERIAL_ENGINE_TYPES,
  type MaterialEngineInput,
  type MaterialEngineRequest,
  type MaterialEngineType,
} from "./material-engine-types";

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toSafeQuantity(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 10;
  return Math.max(1, Math.min(30, Math.round(parsed)));
}

function normalizeType(value: unknown): MaterialEngineType {
  const raw = asText(value, "").toLowerCase() as MaterialEngineType;
  if (MATERIAL_ENGINE_TYPES.includes(raw)) return raw;
  return raw;
}

export function normalizeMaterialEngineRequest(
  payload: MaterialEngineInput,
): MaterialEngineRequest {
  return {
    tipoMaterial: normalizeType(payload.tipoMaterial || payload.tipo),
    etapa: asText(payload.etapa, "Ensino Fundamental"),
    anoSerie: asText(payload.anoSerie),
    componenteCurricular: asText(
      payload.componenteCurricular || payload.componente,
    ),
    tema: asText(payload.tema || payload.temaCentral),
    objetivo: asText(payload.objetivo || payload.objetivos),
    quantidade: toSafeQuantity(payload.quantidade),
    dificuldade: asText(payload.dificuldade, "media"),
    formatoJogo: asText(payload.formatoJogo, "") || null,
    incluirGabarito: payload.incluirGabarito !== false,
    modeloSlides: asText(payload.modeloSlides, "") || undefined,
    designSlides: asText(payload.designSlides, "") || undefined,
  };
}

export function validateMaterialEngineRequest(
  request: MaterialEngineRequest,
): string[] {
  const errors: string[] = [];

  if (!request.tema) errors.push("Informe o tema para gerar o material.");
  if (!request.anoSerie)
    errors.push("Informe o ano/série para adequar a linguagem.");
  if (!request.componenteCurricular)
    errors.push("Informe o componente curricular.");

  if (!MATERIAL_ENGINE_TYPES.includes(request.tipoMaterial)) {
    errors.push("Tipo de material inválido. Selecione uma ferramenta do Planify.");
  }

  if (request.tipoMaterial === "jogo" && !request.formatoJogo) {
    errors.push("Selecione o formato do jogo.");
  }

  return errors;
}
