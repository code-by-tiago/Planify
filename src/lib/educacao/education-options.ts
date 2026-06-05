export const EDUCATION_STAGES = [
  "Educação Infantil",
  "Ensino Fundamental",
  "Ensino Médio",
  "EJA",
] as const;

export type EducationStage = (typeof EDUCATION_STAGES)[number];

export const EDUCATION_OPTIONS = {
  "Educação Infantil": {
    years: ["Berçário", "Maternal I", "Maternal II", "Pré I", "Pré II"],
    areas: ["Campos de experiências"],
    componentsByArea: {
      "Campos de experiências": [
        "O eu, o outro e o nós",
        "Corpo, gestos e movimentos",
        "Traços, sons, cores e formas",
        "Escuta, fala, pensamento e imaginação",
        "Espaços, tempos, quantidades, relações e transformações",
      ],
    },
  },
  "Ensino Fundamental": {
    years: [
      "1º ano",
      "2º ano",
      "3º ano",
      "4º ano",
      "5º ano",
      "6º ano",
      "7º ano",
      "8º ano",
      "9º ano",
    ],
    areas: [
      "Linguagens",
      "Matemática",
      "Ciências da Natureza",
      "Ciências Humanas",
      "Ensino Religioso",
    ],
    componentsByArea: {
      Linguagens: [
        "Língua Portuguesa",
        "Redação",
        "Escrita Criativa",
        "Arte",
        "Educação Física",
        "Língua Inglesa",
        "Língua Espanhola",
      ],
      Matemática: ["Matemática"],
      "Ciências da Natureza": ["Ciências"],
      "Ciências Humanas": ["História", "Geografia"],
      "Ensino Religioso": ["Ensino Religioso"],
    },
  },
  "Ensino Médio": {
    years: ["1ª série", "2ª série", "3ª série"],
    areas: [
      "Linguagens e suas Tecnologias",
      "Matemática e suas Tecnologias",
      "Ciências da Natureza e suas Tecnologias",
      "Ciências Humanas e Sociais Aplicadas",
    ],
    componentsByArea: {
      "Linguagens e suas Tecnologias": [
        "Língua Portuguesa",
        "Redação",
        "Escrita Criativa",
        "Arte",
        "Educação Física",
        "Língua Inglesa",
        "Língua Espanhola",
      ],
      "Matemática e suas Tecnologias": ["Matemática"],
      "Ciências da Natureza e suas Tecnologias": [
        "Biologia",
        "Física",
        "Química",
      ],
      "Ciências Humanas e Sociais Aplicadas": [
        "História",
        "Geografia",
        "Filosofia",
        "Sociologia",
      ],
    },
  },
  EJA: {
    years: [
      "EJA — Anos iniciais",
      "EJA — Anos finais",
      "EJA — Ensino Médio",
    ],
    areas: [
      "Linguagens",
      "Matemática",
      "Ciências Humanas",
      "Ciências da Natureza",
    ],
    componentsByArea: {
      Linguagens: ["Língua Portuguesa", "Redação", "Língua Inglesa"],
      Matemática: ["Matemática"],
      "Ciências Humanas": ["História", "Geografia"],
      "Ciências da Natureza": ["Ciências", "Biologia"],
    },
  },
} as const;

export type MaterialEducationFields = {
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componente: string;
};

export const DEFAULT_MATERIAL_EDUCATION: MaterialEducationFields = {
  etapa: "Ensino Fundamental",
  anoSerie: "6º ano",
  areaConhecimento: "Linguagens",
  componente: "Língua Portuguesa",
};

function isEducationStage(value: string): value is EducationStage {
  return (EDUCATION_STAGES as readonly string[]).includes(value);
}

export function getEducationConfig(stage: string) {
  return EDUCATION_OPTIONS[
    isEducationStage(stage) ? stage : "Ensino Fundamental"
  ];
}

export function getYearOptions(stage: string): string[] {
  return [...getEducationConfig(stage).years];
}

export function getAreaOptions(stage: string): string[] {
  return [...getEducationConfig(stage).areas];
}

export function getComponentOptions(stage: string, area: string): string[] {
  const config = getEducationConfig(stage);
  const selectedArea = (config.areas as readonly string[]).includes(area)
    ? area
    : config.areas[0];
  const options =
    config.componentsByArea[
      selectedArea as keyof typeof config.componentsByArea
    ];

  return options
    ? [...options]
    : Object.values(config.componentsByArea).flat();
}

export function normalizeMaterialEducation(
  current: MaterialEducationFields,
  patch: Partial<MaterialEducationFields> = {},
): MaterialEducationFields {
  const next: MaterialEducationFields = { ...current, ...patch };
  const config = getEducationConfig(next.etapa);

  if (!(config.years as readonly string[]).includes(next.anoSerie)) {
    next.anoSerie = config.years[0];
  }

  if (!(config.areas as readonly string[]).includes(next.areaConhecimento)) {
    next.areaConhecimento = config.areas[0];
  }

  const components = getComponentOptions(next.etapa, next.areaConhecimento);

  if (!components.includes(next.componente)) {
    next.componente = components[0] || "";
  }

  return next;
}

/** Ajusta disciplina ao trocar de ferramenta (ex.: redação → componente Redação). */
export function educationDefaultsForTool(
  toolId: string,
  base: MaterialEducationFields = DEFAULT_MATERIAL_EDUCATION,
): MaterialEducationFields {
  const normalized = normalizeMaterialEducation(base);

  if (toolId === "redacao") {
    const components = getComponentOptions(
      normalized.etapa,
      normalized.areaConhecimento,
    );
    const redacao = components.find((c) => c.toLowerCase().includes("redação"));
    if (redacao) {
      normalized.componente = redacao;
    }
  }

  return normalized;
}
