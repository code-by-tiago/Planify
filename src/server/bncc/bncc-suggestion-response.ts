import { filterExtractedBnccByStage } from "./bncc-stage-filter";
import type { BnccSkillSuggestion } from "./bncc-suggestion-engine";
import type { BnccSuggestionEngineResult } from "./bncc-suggestion-quality";

export type BnccSuggestionApiResult = BnccSuggestionEngineResult & {
  sugeridas?: BnccSkillSuggestion[];
  skills?: BnccSkillSuggestion[];
  items?: BnccSkillSuggestion[];
  data?: {
    conteudos?: BnccSuggestionEngineResult["conteudos"];
    habilidades?: BnccSkillSuggestion[];
    sugeridas?: BnccSkillSuggestion[];
  };
};

export function applyStageFilterToBnccSuggestionResult(
  result: BnccSuggestionApiResult,
  etapa?: string | null,
  anoSerie?: string | null,
): BnccSuggestionApiResult {
  const habilidades = result.habilidades || [];
  const filtered = filterExtractedBnccByStage(
    {
      codes: habilidades.map((skill) => skill.codigo),
      skills: habilidades.map((skill) => ({
        codigo: skill.codigo,
        descricao: skill.descricao,
        componente: skill.componente,
        etapa: skill.etapa,
        anoSerie: skill.anoSerie,
      })),
    },
    etapa,
    anoSerie,
  );

  const allowedCodes = new Set(filtered.codes.map((code) => code.toUpperCase()));
  const filterSkills = (skills: BnccSkillSuggestion[]) =>
    skills.filter((skill) => allowedCodes.has(String(skill.codigo || "").toUpperCase()));

  const conteudos = (result.conteudos || []).map((group) => ({
    ...group,
    habilidades: filterSkills(group.habilidades || []),
  }));

  const nextSkills = filterSkills(habilidades);

  return {
    ...result,
    conteudos,
    habilidades: nextSkills,
    sugeridas: nextSkills,
    skills: nextSkills,
    items: nextSkills,
    total: nextSkills.length,
    data: {
      conteudos,
      habilidades: nextSkills,
      sugeridas: nextSkills,
    },
  };
}
