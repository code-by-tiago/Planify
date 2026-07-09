export const PLANNING_MATRIX_SKILL_SCHEMA = {
  type: "OBJECT",
  properties: {
    codigo: { type: "STRING" },
    descricao: { type: "STRING" },
  },
  required: ["codigo", "descricao"],
} as const;

export const PLANNING_MATRIX_ITEM_SCHEMA = {
  type: "OBJECT",
  properties: {
    conteudo: { type: "STRING" },
    trimestre: { type: "INTEGER" },
    numeroAula: { type: "INTEGER" },
    periodos: { type: "INTEGER" },
    aulaInicio: { type: "INTEGER" },
    aulaFim: { type: "INTEGER" },
    habilidades: {
      type: "ARRAY",
      items: PLANNING_MATRIX_SKILL_SCHEMA,
    },
    objetivos: { type: "STRING" },
    metodologia: { type: "STRING" },
    materiais: { type: "STRING" },
    recursos: { type: "STRING" },
    etapas: { type: "STRING" },
    avaliacao: { type: "STRING" },
    evidencias: { type: "STRING" },
  },
  required: [
    "conteudo",
    "trimestre",
    "numeroAula",
    "periodos",
    "aulaInicio",
    "aulaFim",
    "habilidades",
    "objetivos",
    "metodologia",
    "materiais",
    "recursos",
    "etapas",
    "avaliacao",
    "evidencias",
  ],
} as const;

export const PLANNING_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    planejamento: {
      type: "OBJECT",
      properties: {
        tipoPlanejamento: { type: "STRING" },
        titulo: { type: "STRING" },
        resumo: { type: "STRING" },
        conteudos: {
          type: "ARRAY",
          items: PLANNING_MATRIX_ITEM_SCHEMA,
        },
      },
      required: ["tipoPlanejamento", "titulo", "resumo", "conteudos"],
    },
  },
  required: ["planejamento"],
} as const;
