export const INCLUSAO_GENERATION_TYPE = "inclusao";

export const INCLUSAO_MODES = [
  {
    id: "adaptacao",
    label: "Adaptação de Atividades",
    description: "Adapte atividade ou plano para a necessidade selecionada.",
  },
  {
    id: "trilhas",
    label: "Trilhas Paralelas",
    description: "Mesmo conteúdo em 2–3 níveis de dificuldade para a mesma turma.",
  },
  {
    id: "relatorio",
    label: "Relatório de Progresso",
    description: "Transforme observações em relatório formal para coordenação e família.",
  },
  {
    id: "mediacao",
    label: "Dicas de Mediação",
    description: "Práticas de mediação pedagógica para o estudante incluído.",
  },
] as const;

export type InclusaoModeId = (typeof INCLUSAO_MODES)[number]["id"];

export const INCLUSAO_NEEDS = [
  {
    id: "tea",
    label: "TEA",
    description: "Transtorno do Espectro Autista",
  },
  {
    id: "tdah",
    label: "TDAH",
    description: "Déficit de Atenção e Hiperatividade",
  },
  {
    id: "dislexia",
    label: "Dislexia",
    description: "Dificuldades específicas de leitura e escrita",
  },
  {
    id: "deficiencia-intelectual",
    label: "Deficiência Intelectual",
    description: "Aprendizagem concreta e apoios visuais",
  },
  {
    id: "altas-habilidades",
    label: "Altas Habilidades / Superdotação",
    description: "Enriquecimento e complexificação",
  },
] as const;

export type InclusaoNeedId = (typeof INCLUSAO_NEEDS)[number]["id"];

export const INCLUSAO_EDUCATION_LEVELS = [
  "Educação Infantil",
  "EF I (1º ao 5º ano)",
  "EF II (6º ao 9º ano)",
  "Ensino Médio",
] as const;

export type InclusaoEducationLevel = (typeof INCLUSAO_EDUCATION_LEVELS)[number];

export function getInclusaoNeedLabel(id: InclusaoNeedId): string {
  return INCLUSAO_NEEDS.find((n) => n.id === id)?.label ?? id;
}

export function getInclusaoModeLabel(id: InclusaoModeId): string {
  return INCLUSAO_MODES.find((m) => m.id === id)?.label ?? id;
}
