export type MaterialGameFormat =
  | "caca_palavras"
  | "cruzadinha"
  | "bingo_pedagogico"
  | "jogo_memoria"
  | "domino_pedagogico"
  | "trilha_tabuleiro"
  | "cartas_desafio"
  | "quiz_equipes"
  | "roleta_perguntas"
  | "verdadeiro_falso_grupos"
  | "jogo_associacao"
  | "escape_room_educativo"
  | "dinamica_cooperativa";

export type MaterialGameFormatRule = {
  value: MaterialGameFormat;
  label: string;
  description: string;
  printable: boolean;
  minimumItems: number;
  recommendedItems: number;
  itemLabel: string;
  teacherDeliverables: string[];
};

export const MATERIAL_GAME_FORMAT_RULES: Record<MaterialGameFormat, MaterialGameFormatRule> = {
  caca_palavras: {
    value: "caca_palavras",
    label: "Caça-palavras",
    description: "Grade imprimível com palavras do tema, lista do aluno e gabarito do professor.",
    printable: true,
    minimumItems: 10,
    recommendedItems: 16,
    itemLabel: "palavras",
    teacherDeliverables: ["grade do aluno", "lista de palavras", "gabarito", "atividade pós-jogo"],
  },
  cruzadinha: {
    value: "cruzadinha",
    label: "Cruzadinha",
    description: "Cruzadinha com pistas horizontais/verticais, grade do aluno e gabarito preenchido.",
    printable: true,
    minimumItems: 8,
    recommendedItems: 14,
    itemLabel: "pistas e respostas",
    teacherDeliverables: ["grade em branco", "pistas", "gabarito", "mediação"],
  },
  bingo_pedagogico: {
    value: "bingo_pedagogico",
    label: "Bingo pedagógico",
    description: "Cartelas variadas, lista de sorteio, definições do professor e regras de vitória.",
    printable: true,
    minimumItems: 18,
    recommendedItems: 28,
    itemLabel: "termos/conceitos",
    teacherDeliverables: ["cartelas", "sorteio", "conceitos", "fechamento"],
  },
  jogo_memoria: {
    value: "jogo_memoria",
    label: "Jogo da memória",
    description: "Pares recortáveis de conceito/definição ou termo/exemplo, com gabarito.",
    printable: true,
    minimumItems: 8,
    recommendedItems: 14,
    itemLabel: "pares",
    teacherDeliverables: ["cartas recortáveis", "pares corretos", "regras", "variações"],
  },
  domino_pedagogico: {
    value: "domino_pedagogico",
    label: "Dominó pedagógico",
    description: "Peças encadeadas com conceito/resposta para imprimir, recortar e jogar.",
    printable: true,
    minimumItems: 10,
    recommendedItems: 18,
    itemLabel: "peças",
    teacherDeliverables: ["peças", "sequência correta", "regras", "gabarito"],
  },
  trilha_tabuleiro: {
    value: "trilha_tabuleiro",
    label: "Trilha ou tabuleiro",
    description: "Casas numeradas, desafios por casa, regras, pontuação e cartas de pergunta.",
    printable: true,
    minimumItems: 12,
    recommendedItems: 24,
    itemLabel: "casas/desafios",
    teacherDeliverables: ["trilha", "cartas", "regras", "pontuação"],
  },
  cartas_desafio: {
    value: "cartas_desafio",
    label: "Cartas de desafio",
    description: "Baralho pedagógico com desafios, respostas esperadas e critérios de pontuação.",
    printable: true,
    minimumItems: 10,
    recommendedItems: 20,
    itemLabel: "cartas",
    teacherDeliverables: ["cartas", "respostas", "pontuação", "mediação"],
  },
  quiz_equipes: {
    value: "quiz_equipes",
    label: "Quiz em equipes",
    description: "Rodadas de perguntas com níveis, gabarito, desempate e critérios claros.",
    printable: false,
    minimumItems: 10,
    recommendedItems: 20,
    itemLabel: "perguntas",
    teacherDeliverables: ["perguntas", "gabarito", "rodadas", "desempate"],
  },
  roleta_perguntas: {
    value: "roleta_perguntas",
    label: "Roleta de perguntas",
    description: "Categorias, perguntas por rodada e regras para roleta física ou digital.",
    printable: false,
    minimumItems: 12,
    recommendedItems: 24,
    itemLabel: "perguntas/categorias",
    teacherDeliverables: ["categorias", "perguntas", "regras", "pontuação"],
  },
  verdadeiro_falso_grupos: {
    value: "verdadeiro_falso_grupos",
    label: "Verdadeiro ou falso em grupos",
    description: "Afirmações contextualizadas, justificativas e dinâmica de defesa da resposta.",
    printable: true,
    minimumItems: 12,
    recommendedItems: 20,
    itemLabel: "afirmações",
    teacherDeliverables: ["afirmações", "gabarito comentado", "rodadas", "debate"],
  },
  jogo_associacao: {
    value: "jogo_associacao",
    label: "Jogo de associação",
    description: "Cartas de associação entre termos, imagens sugeridas, definições, exemplos ou causas/consequências.",
    printable: true,
    minimumItems: 10,
    recommendedItems: 18,
    itemLabel: "pares/associações",
    teacherDeliverables: ["cartas", "pares corretos", "gabarito", "variações"],
  },
  escape_room_educativo: {
    value: "escape_room_educativo",
    label: "Escape room educativo",
    description: "Missão, enigmas, pistas, sequência de resolução, senhas e papel do professor.",
    printable: true,
    minimumItems: 5,
    recommendedItems: 8,
    itemLabel: "enigmas",
    teacherDeliverables: ["missão", "enigmas", "pistas", "solução"],
  },
  dinamica_cooperativa: {
    value: "dinamica_cooperativa",
    label: "Dinâmica cooperativa",
    description: "Dinâmica de grupo com cooperação, produto final, papéis e socialização.",
    printable: false,
    minimumItems: 8,
    recommendedItems: 14,
    itemLabel: "desafios/papéis",
    teacherDeliverables: ["passo a passo", "papéis", "desafios", "fechamento"],
  },
};

export const MATERIAL_GAME_FORMAT_OPTIONS = Object.values(MATERIAL_GAME_FORMAT_RULES).map((rule) => ({
  value: rule.value,
  label: rule.label,
  description: rule.description,
}));

export function getMaterialGameFormatRule(format: string | undefined | null): MaterialGameFormatRule {
  const normalized = String(format || "caca_palavras").trim() as MaterialGameFormat;
  return MATERIAL_GAME_FORMAT_RULES[normalized] || MATERIAL_GAME_FORMAT_RULES.caca_palavras;
}

export function getMaterialGameFormatLabel(format: string | undefined | null): string {
  return getMaterialGameFormatRule(format).label;
}

export function normalizeGameItemCount(format: string | undefined | null, requested: number | undefined, size: string): number {
  const rule = getMaterialGameFormatRule(format);
  const safeRequested = Number.isFinite(Number(requested)) ? Math.max(0, Math.floor(Number(requested))) : 0;

  const defaultBySize = size === "completo" ? rule.recommendedItems + 6 : size === "curto" ? rule.minimumItems : rule.recommendedItems;
  const target = safeRequested > 0 ? safeRequested : defaultBySize;

  return Math.max(rule.minimumItems, Math.min(60, target));
}
