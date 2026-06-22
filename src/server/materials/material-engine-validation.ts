import {
  bnccCodeMatchesStage,
  resolveBnccStageFromFields,
} from "@/lib/bncc/bncc-stage-filter";
import {
  MATERIAL_ENGINE_TYPES,
  type MaterialEngineInput,
  type MaterialEngineRequest,
  type MaterialEngineType,
} from "./material-engine-types";

function asText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toSafeQuantity(value: unknown, tipo?: MaterialEngineType): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return tipo === "cruzadinha" ? 10 : 10;
  }
  const rounded = Math.round(parsed);
  if (tipo === "cruzadinha") {
    return Math.max(8, Math.min(15, rounded));
  }
  return Math.max(1, Math.min(30, rounded));
}

function normalizeType(value: unknown): MaterialEngineType {
  const raw = asText(value, "").toLowerCase() as MaterialEngineType;
  if (MATERIAL_ENGINE_TYPES.includes(raw)) return raw;
  return raw;
}

function resolveIncluirGabarito(
  tipoMaterial: MaterialEngineType,
  incluirQuestoes: boolean,
  payload: MaterialEngineInput,
): boolean {
  if (tipoMaterial === "slides" && incluirQuestoes) {
    return payload.incluirGabarito === true;
  }
  return payload.incluirGabarito !== false;
}

export function normalizeMaterialEngineRequest(
  payload: MaterialEngineInput,
): MaterialEngineRequest {
  const tipoMaterial = normalizeType(payload.tipoMaterial || payload.tipo);
  const incluirQuestoes =
    tipoMaterial === "slides" && payload.incluirQuestoes === true;
  const formatoJogo =
    tipoMaterial === "cruzadinha"
      ? "cruzadinha"
      : asText(payload.formatoJogo, "") || null;

  return {
    tipoMaterial,
    etapa: asText(payload.etapa, "Ensino Fundamental"),
    anoSerie: asText(payload.anoSerie),
    componenteCurricular: asText(
      payload.componenteCurricular || payload.componente,
    ),
    tema: asText(payload.tema || payload.temaCentral),
    objetivo: asText(payload.objetivo || payload.objetivos),
    quantidade: toSafeQuantity(payload.quantidade, tipoMaterial),
    dificuldade: asText(payload.dificuldade, "media"),
    formatoJogo,
    incluirGabarito: resolveIncluirGabarito(tipoMaterial, incluirQuestoes, payload),
    incluirQuestoes: incluirQuestoes || undefined,
    quantidadeQuestoes: incluirQuestoes
      ? toSafeQuantity(payload.quantidadeQuestoes ?? 3)
      : undefined,
    modeloSlides: asText(payload.modeloSlides, "") || undefined,
    designSlides: asText(payload.designSlides, "") || undefined,
    observacoes: asText(payload.observacoes, "") || undefined,
    elevarQualidade: payload.elevarQualidade === true,
    problemasQualidade: Array.isArray(payload.problemasQualidade)
      ? payload.problemasQualidade.map((item) => String(item).trim()).filter(Boolean)
      : undefined,
    habilidadesSelecionadas: normalizeBnccSkillsForPrompt(
      payload.habilidadesSelecionadas ?? payload.habilidadesBncc,
    ),
  };
}

function normalizeBnccSkillsForPrompt(
  value: MaterialEngineInput["habilidadesSelecionadas"],
): MaterialEngineRequest["habilidadesSelecionadas"] {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const skills = value
    .map((skill) => {
      const codigo = String(skill?.codigo || "").trim().toUpperCase();
      const descricao = String(skill?.descricao || "").trim();
      if (!codigo || !descricao) return null;
      return {
        codigo,
        descricao,
        conteudo: skill?.conteudo ? String(skill.conteudo).trim() : undefined,
      };
    })
    .filter((skill): skill is NonNullable<typeof skill> => Boolean(skill));

  return skills.length > 0 ? skills.slice(0, 24) : undefined;
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

  const skills = request.habilidadesSelecionadas ?? [];

  if (skills.length > 0) {
    const stage = resolveBnccStageFromFields(request.etapa, request.anoSerie);

    for (const skill of skills) {
      const codigo = String(skill.codigo || "").trim();
      const descricao = String(skill.descricao || "").trim();

      if (!codigo || !descricao) {
        errors.push(
          "Todas as habilidades selecionadas precisam ter código e descrição.",
        );
        break;
      }

      if (stage && !bnccCodeMatchesStage(codigo.toUpperCase(), stage)) {
        errors.push(
          `A habilidade ${codigo} não pertence à etapa informada (${request.etapa}).`,
        );
        break;
      }
    }
  }

  return errors;
}
