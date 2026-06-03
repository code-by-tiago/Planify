export type MaterialGeneratorType =
  | "resumo"
  | "atividade"
  | "lista"
  | "prova"
  | "simulado"
  | "apostila"
  | "sequencia_didatica"
  | "projeto"
  | "roteiro"
  | "jogo";

export type MaterialGeneratorSize = "curto" | "medio" | "completo";

export type MaterialCreditRule = {
  label: string;
  curto: number;
  medio: number;
  completo: number;
};

export const MATERIAL_CREDIT_RULES: Record<MaterialGeneratorType, MaterialCreditRule> = {
  resumo: {
    label: "Resumo",
    curto: 2,
    medio: 4,
    completo: 6,
  },
  atividade: {
    label: "Atividade",
    curto: 4,
    medio: 6,
    completo: 10,
  },
  lista: {
    label: "Lista de exercícios",
    curto: 5,
    medio: 8,
    completo: 12,
  },
  prova: {
    label: "Prova",
    curto: 8,
    medio: 12,
    completo: 18,
  },
  simulado: {
    label: "Simulado",
    curto: 12,
    medio: 20,
    completo: 30,
  },
  apostila: {
    label: "Apostila",
    curto: 12,
    medio: 25,
    completo: 40,
  },
  sequencia_didatica: {
    label: "Sequência didática",
    curto: 8,
    medio: 14,
    completo: 22,
  },
  projeto: {
    label: "Projeto interdisciplinar",
    curto: 10,
    medio: 18,
    completo: 28,
  },
  roteiro: {
    label: "Roteiro de estudo",
    curto: 5,
    medio: 8,
    completo: 12,
  },
  jogo: {
    label: "Jogo ou dinâmica",
    curto: 6,
    medio: 10,
    completo: 16,
  },
};

export const MATERIAL_TYPE_OPTIONS = Object.entries(MATERIAL_CREDIT_RULES).map(
  ([value, rule]) => ({
    value: value as MaterialGeneratorType,
    label: rule.label,
  }),
);

export const MATERIAL_SIZE_OPTIONS: Array<{
  value: MaterialGeneratorSize;
  label: string;
  description: string;
}> = [
  {
    value: "curto",
    label: "Curto",
    description: "Entrega objetiva para uma aula, revisão rápida ou atividade simples.",
  },
  {
    value: "medio",
    label: "Médio",
    description: "Material completo para aplicação comum em sala.",
  },
  {
    value: "completo",
    label: "Completo",
    description: "Entrega mais robusta, com aprofundamento, gabarito e orientação docente.",
  },
];

export function getMaterialCreditCost(
  type: string,
  size: string,
): number {
  const normalizedType = String(type || "").trim() as MaterialGeneratorType;
  const normalizedSize = String(size || "medio").trim() as MaterialGeneratorSize;
  const rule = MATERIAL_CREDIT_RULES[normalizedType] || MATERIAL_CREDIT_RULES.atividade;

  return rule[normalizedSize] || rule.medio;
}

export function getMaterialTypeLabel(type: string): string {
  const normalizedType = String(type || "").trim() as MaterialGeneratorType;
  return MATERIAL_CREDIT_RULES[normalizedType]?.label || "Material didático";
}

export function materialTypeNeedsQuestions(type: string): boolean {
  return ["atividade", "lista", "prova", "simulado", "resumo"].includes(
    String(type || "").trim(),
  );
}
