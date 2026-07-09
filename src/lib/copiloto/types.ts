export const COPILOTO_MATERIAL_TYPES = [
  "lista",
  "prova",
  "redacao",
  "plano-aula",
  "atividade",
] as const;

export type CopilotoMaterialType = (typeof COPILOTO_MATERIAL_TYPES)[number];

export const COPILOTO_TYPE_LABELS: Record<CopilotoMaterialType, string> = {
  lista: "Lista de exercícios",
  prova: "Prova",
  redacao: "Redação",
  "plano-aula": "Plano de aula",
  atividade: "Atividade (dinâmica)",
};

export type CopilotoFieldConfidence = "alta" | "media" | "baixa";

export type CopilotoInclusaoBrief = {
  ativa: boolean;
  necessidades: string[];
  adaptacoesSugeridas: string[];
  resumo: string;
};

export type CopilotoBnccSkill = {
  codigo: string;
  descricao: string;
};

export type CopilotoTendencia = {
  fonte: "enem" | "vestibular" | "concurso" | "banco";
  topico: string;
  evidencias: number;
  enfaseSugerida: string;
};

export type CopilotoAlinhamento = {
  habilidades: CopilotoBnccSkill[];
  tendencias: CopilotoTendencia[];
  resumo: string;
};

export type CopilotoBrief = {
  transcript: string;
  tipoMaterial: CopilotoMaterialType;
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componenteCurricular: string;
  tema: string;
  conteudo: string;
  quantidade: number;
  dificuldade: "facil" | "media" | "avancada";
  inclusao: CopilotoInclusaoBrief;
  alinhamento: CopilotoAlinhamento;
  confianca: Partial<
    Record<
      | "tipoMaterial"
      | "etapa"
      | "anoSerie"
      | "componenteCurricular"
      | "tema"
      | "inclusao",
      CopilotoFieldConfidence
    >
  >;
  resumoPedido: string;
  /** Aviso quando o pedido foi remapeado (ex.: cruzadinha → lista). */
  remapNotice?: string | null;
  /** Aviso quando BNCC/banco não retornaram alinhamento útil. */
  alinhamentoAviso?: string | null;
};

/** Marcador injetado no payload para o promptEngine liberar texto-fonte. */
export const COPILOTO_TEXTO_FONTE_MARKER = "COPILOTO_TEXTO_FONTE";

export function detectCopilotoReadingIntent(text: string): boolean {
  const t = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  return (
    /cronica|conto|poema|texto para leitura|texto[- ]fonte|interpretacao|compreensao textual|trecho|leitura/.test(
      t,
    ) || /clarice|lispector|machado de assis|drummond/.test(t)
  );
}

export function detectCopilotoDynamicIntent(text: string): boolean {
  const t = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
  return /dinamica|ludica|jogo de sala|circuito|estacao|role play|dramatizacao|oficina/.test(
    t,
  );
}

export function capCopilotoQuantity(
  tipo: CopilotoMaterialType,
  raw: number,
): number {
  const n = Number.isFinite(raw) ? Math.round(raw) : 0;
  switch (tipo) {
    case "redacao":
      return Math.min(5, Math.max(2, n || 3));
    case "plano-aula":
      return Math.min(3, Math.max(1, n || 1));
    case "atividade":
      return Math.min(3, Math.max(1, n || 1));
    case "lista":
    case "prova":
    default:
      return Math.min(15, Math.max(5, n || 10));
  }
}
