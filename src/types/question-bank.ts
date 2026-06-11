export type QuestionBankItem = {
  id: string;
  enunciado: string;
  /** Texto de leitura/apoio exibido uma vez por grupo de questões */
  textoApoio?: string;
  tipo: string;
  alternativas: string[];
  respostaEsperada: string;
  criterioCorrecao: string;
  componente: string;
  anoSerie: string;
  etapa: string;
  tema: string;
  bnccCodigos: string[];
  tags: string[];
  sourceTitle?: string;
  sourceType?: string;
  isCommunity?: boolean;
  isSchool?: boolean;
  authorName?: string;
  usageCount?: number;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type QuestionBankFilter = {
  /** Tema ou assunto da aula — busca inteligente, sem precisar de código BNCC */
  query: string;
  componente: string;
  anoSerie: string;
  /** Filtro manual opcional (avançado) */
  bncc: string;
  /** Preenchido automaticamente ao escolher tema sugerido pela BNCC */
  bnccCodigos?: string[];
  source: "todas" | "minhas" | "comunidade" | "escola";
};
