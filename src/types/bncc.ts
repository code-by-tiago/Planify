export type BNCCStage =
  | "educacao_infantil"
  | "ensino_fundamental"
  | "ensino_medio"
  | "unknown";

export type BNCCSkill = {
  id: string;
  codigo: string;
  descricao: string;
  etapa: BNCCStage;
  ano?: string;
  serie?: string;
  componente?: string;
  areaConhecimento?: string;
  unidadeTematica?: string;
  objetoConhecimento?: string;
  camposExperiencia?: string;
  keywords: string[];
  fonte?: string;
};

export type BnccSkill = BNCCSkill;

export type BNCCSuggestionRequest = {
  etapa?: string;
  anoSerie?: string;
  componenteCurricular?: string;
  conteudo?: string;
  limite?: number;
};

export type BNCCSuggestionResponse = {
  success: boolean;
  message: string;
  habilidades: BNCCSkill[];
  total: number;
  baseInstalada: boolean;
};

export type BnccSkillSuggestion = {
  skill: BNCCSkill;
  relevanceScore: number;
  reason: string;
  selected: boolean;
};
