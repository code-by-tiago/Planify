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
  /** Coleção editorial para separar acervo escolar, exames e concursos. */
  collection?: QuestionBankCollection;
  /** URL pública registrada para fontes autorizadas. */
  sourceUrl?: string;
  /** Licença ou termo de uso registrado na importação. */
  sourceLicense?: string;
  /** Como a questão foi revisada antes da publicação no acervo. */
  reviewStatus?: QuestionBankReviewStatus;
  /** Nota da revisão automatizada, quando aplicável (0 a 10). */
  qualityScore?: number;
  reviewedAt?: string;
  isCommunity?: boolean;
  isSchool?: boolean;
  authorName?: string;
  usageCount?: number;
  contentHash?: string;
  createdAt: string;
  updatedAt: string;
};

export type QuestionBankCollection =
  | "escolar"
  | "enem"
  | "vestibular"
  | "concurso"
  | "superior"
  | "geral";

export type QuestionBankReviewStatus =
  | "community"
  | "automated"
  | "human-reviewed"
  | "pending";

export type QuestionBankSource =
  | "todas"
  | "minhas"
  | "comunidade"
  | "escola"
  | "curadas";

export type QuestionBankEtapa =
  | "todos"
  | "Ensino Fundamental"
  | "Ensino Médio"
  | "ENEM e Vestibulares"
  | "Ensino Superior"
  | "Concursos Públicos";

export type QuestionBankFilter = {
  /** Tema ou assunto da aula — busca inteligente, sem precisar de código BNCC */
  query: string;
  /** Nível escolar — restringe séries/anos compatíveis */
  etapa: QuestionBankEtapa;
  componente: string;
  anoSerie: string;
  /** Filtro manual opcional (avançado) */
  bncc: string;
  /** Preenchido automaticamente ao escolher tema sugerido pela BNCC */
  bnccCodigos?: string[];
  /** Conteúdo/descrição das habilidades selecionadas — matching semântico no acervo */
  bnccSearchTerms?: string[];
  source: QuestionBankSource;
};

export const DEFAULT_QUESTION_BANK_FILTER: QuestionBankFilter = {
  query: "",
  etapa: "todos",
  componente: "todos",
  anoSerie: "todos",
  bncc: "",
  bnccCodigos: undefined,
  source: "todas",
};
