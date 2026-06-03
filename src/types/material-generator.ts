import type {
  MaterialGeneratorSize,
  MaterialGeneratorType,
} from "../config/material-credits";

export type MaterialGeneratorObjective =
  | "ensinar"
  | "revisar"
  | "avaliar"
  | "aprofundar"
  | "recuperar_aprendizagem";

export type MaterialGeneratorDifficulty =
  | "basico"
  | "intermediario"
  | "avancado";

export type MaterialGeneratorQuestionType =
  | "multipla_escolha"
  | "discursiva"
  | "verdadeiro_falso"
  | "complete"
  | "associacao"
  | "analise_contextualizada";

export type MaterialGeneratorBNCCSkill = {
  codigo: string;
  descricao: string;
  etapa?: string;
  anoSerie?: string;
  componente?: string;
  area?: string;
  conteudo?: string;
};

export type MaterialGeneratorRequest = {
  idempotencyKey?: string;
  escola?: string;
  professor?: string;
  turma?: string;
  tipoMaterial: MaterialGeneratorType;
  etapaEnsino: string;
  anoSerie: string;
  areaConhecimento?: string;
  componenteCurricular: string;
  temaCentral: string;
  objetivo: MaterialGeneratorObjective | string;
  tamanho: MaterialGeneratorSize;
  nivelDificuldade: MaterialGeneratorDifficulty | string;
  quantidadeQuestoes?: number;
  tiposQuestao?: MaterialGeneratorQuestionType[];
  habilidadesBncc?: MaterialGeneratorBNCCSkill[];
  gerarGabarito?: boolean;
  gerarVersaoProfessor?: boolean;
  recursosDisponiveis?: string;
  inclusaoAcessibilidade?: string;
  tomLinguagem?: string;
  observacoes?: string;
};

export type MaterialGeneratedBlock = {
  tipoBloco: "paragrafo" | "destaque" | "lista" | "tabela" | "exemplo" | string;
  texto: string;
  itens?: string[];
};

export type MaterialGeneratedSection = {
  ordem: number;
  titulo: string;
  tipo: string;
  conteudo: MaterialGeneratedBlock[];
};

export type MaterialGeneratedQuestion = {
  numero: number;
  tipo: string;
  enunciado: string;
  alternativas: string[];
  respostaEsperada: string;
  habilidadeBncc: string;
  nivel: string;
};

export type MaterialGeneratedActivity = {
  titulo: string;
  instrucoes: string;
  questoes: MaterialGeneratedQuestion[];
};

export type MaterialGeneratedAnswer = {
  questao: number;
  resposta: string;
};

export type PlanifyGeneratedMaterial = {
  metadata: {
    titulo: string;
    tipoMaterial: string;
    etapaEnsino: string;
    anoSerie: string;
    componenteCurricular: string;
    temaCentral: string;
    nivelDificuldade: string;
    tempoEstimado: string;
    creditCost?: number;
    bncc: MaterialGeneratorBNCCSkill[];
  };
  capa: {
    titulo: string;
    subtitulo: string;
    descricao: string;
  };
  introducao: {
    texto: string;
  };
  objetivosAprendizagem: string[];
  secoes: MaterialGeneratedSection[];
  atividades: MaterialGeneratedActivity[];
  gabarito: MaterialGeneratedAnswer[];
  criteriosAvaliacao: string[];
  sugestoesUsoProfessor: string[];
  htmlEditor: string;

  // Campos compatíveis com o exportador DOCX atual do Planify.
  titulo: string;
  subtitulo: string;
  tipo: string;
  resumo: string;
  dadosGerais: {
    escola?: string;
    professor?: string;
    turma?: string;
    etapa: string;
    anoSerie: string;
    areaConhecimento?: string;
    componenteCurricular: string;
    tema: string;
    duracao?: string;
  };
  objetivos: string[];
  conteudos: string[];
  orientacoesProfessor: string[];
  orientacoesAluno: string[];
  questoes: MaterialGeneratedQuestion[];
  sugestoesUso: string[];
  alertas: string[];
};

export type MaterialGenerationCreditInfo = {
  cost: number;
  mode: "reserved" | "bypass" | "duplicate" | "not_configured";
  message: string;
  balanceAfter?: number | null;
};

export type MaterialGenerationResponse = {
  success: true;
  data: {
    material: PlanifyGeneratedMaterial;
    credit: MaterialGenerationCreditInfo;
    requestHash: string;
    idempotencyKey: string;
    duplicate: boolean;
  };
};

export type MaterialGenerationErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
};
