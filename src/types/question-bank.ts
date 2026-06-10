export type QuestionBankItem = {
  id: string;
  enunciado: string;
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
  query: string;
  componente: string;
  anoSerie: string;
  bncc: string;
  source: "todas" | "minhas" | "comunidade" | "escola";
};
