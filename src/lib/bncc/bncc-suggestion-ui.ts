import {
  bnccCodeMatchesStage,
  resolveBnccStageFromFields,
} from "./bncc-stage-filter";

export type BnccSkillOption = {
  id: string;
  codigo: string;
  descricao: string;
  texto?: string;
  label?: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  conteudo: string;
  source?: "local" | "fallback";
};

export type BnccSkillGroup = {
  conteudo: string;
  habilidades: BnccSkillOption[];
};

export type BnccSelectedSkillPayload = {
  codigo: string;
  descricao: string;
  etapa?: string;
  anoSerie?: string;
  area?: string;
  componente?: string;
  conteudo?: string;
};

export {
  conteudosFieldNeedsNormalization,
  conteudosTopicsWouldChange,
  normalizeConteudosFieldText,
  splitTopicLines,
} from "./split-topic-lines";

export function normalizeBnccSkillOption(
  skill: Record<string, unknown> | null | undefined,
  fallbackConteudo = "",
): BnccSkillOption {
  const codigo = String(skill?.codigo || skill?.code || "BNCC").trim();
  const descricao = String(
    skill?.descricao || skill?.description || skill?.texto || skill?.label || "",
  )
    .replace(codigo, "")
    .replace(/^[-–—:.\s]+/, "")
    .trim();

  return {
    id:
      String(skill?.id || "").trim() ||
      `${codigo}-${fallbackConteudo}-${descricao}`.slice(0, 160),
    codigo,
    descricao: descricao || "Descrição oficial não informada.",
    texto: String(skill?.texto || `${codigo} — ${descricao}`),
    label: String(skill?.label || `${codigo} — ${descricao}`),
    etapa: skill?.etapa ? String(skill.etapa) : undefined,
    anoSerie: skill?.anoSerie ? String(skill.anoSerie) : undefined,
    area: skill?.area ? String(skill.area) : undefined,
    componente: skill?.componente ? String(skill.componente) : undefined,
    conteudo: String(skill?.conteudo || fallbackConteudo || "Tema informado"),
    source: skill?.source === "local" ? "local" : "fallback",
  };
}

export function groupBnccSkillsFromResponse(
  data: Record<string, unknown> | null | undefined,
  topicLines: string[],
): BnccSkillGroup[] {
  const groups: BnccSkillGroup[] = [];

  if (Array.isArray(data?.conteudos)) {
    for (const group of data.conteudos as Record<string, unknown>[]) {
      const conteudo = String(group?.conteudo || "").trim();
      if (!conteudo) continue;

      groups.push({
        conteudo,
        habilidades: Array.isArray(group?.habilidades)
          ? (group.habilidades as Record<string, unknown>[]).map((skill) =>
              normalizeBnccSkillOption(skill, conteudo),
            )
          : [],
      });
    }
  }

  if (groups.length > 0) return groups;

  const fallbackTopic = topicLines[0] || "Tema informado";
  return topicLines.length > 0
    ? topicLines.map((conteudo) => ({ conteudo, habilidades: [] }))
    : [{ conteudo: fallbackTopic, habilidades: [] }];
}

export function mapSelectedBnccSkillsToPayload(
  skills: BnccSkillOption[],
  defaults: {
    etapa: string;
    anoSerie: string;
    areaConhecimento: string;
    componente: string;
  },
): BnccSelectedSkillPayload[] {
  return skills.map((skill) => ({
    codigo: skill.codigo,
    descricao: skill.descricao,
    etapa: skill.etapa || defaults.etapa,
    anoSerie: skill.anoSerie || defaults.anoSerie,
    area: skill.area || defaults.areaConhecimento,
    componente: skill.componente || defaults.componente,
    conteudo: skill.conteudo,
  }));
}

export function validateSelectedBnccSkillsForStage(
  skills: BnccSkillOption[],
  etapa: string,
  anoSerie: string,
): string | null {
  if (skills.length === 0) {
    return "Selecione pelo menos uma habilidade BNCC antes de gerar. Use o botão \"Sugerir habilidades BNCC\" acima.";
  }

  const stage = resolveBnccStageFromFields(etapa, anoSerie);

  for (const skill of skills) {
    const codigo = String(skill.codigo || "").trim();
    const descricao = String(skill.descricao || "").trim();

    if (!codigo || !descricao) {
      return "Todas as habilidades selecionadas precisam ter código e descrição.";
    }

    if (stage && !bnccCodeMatchesStage(codigo.toUpperCase(), stage)) {
      return `A habilidade ${codigo} não pertence à etapa informada (${etapa}).`;
    }
  }

  return null;
}
