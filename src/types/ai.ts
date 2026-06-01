export type AIErrorCode =
  | "missing_api_key"
  | "invalid_request"
  | "gemini_error"
  | "invalid_json"
  | "unsafe_bncc_output"
  | "unknown_error";

export type AISuccessResponse<T> = {
  success: true;
  data: T;
  warnings: string[];
};

export type AIErrorResponse = {
  success: false;
  error: {
    code: AIErrorCode;
    message: string;
    details?: string;
  };
};

export type AIResponse<T> = AISuccessResponse<T> | AIErrorResponse;

export type SelectedBNCCSkill = {
  codigo: string;
  habilidade: string;
  componente?: string;
  etapa?: string;
  anoSerie?: string;
};

export type PlanejamentoAIInput = {
  escola: string;
  professor: string;
  etapa: string;
  anoSerie: string;
  componenteCurricular: string;
  cargaHoraria: string;
  tipo: "anual" | "trimestral" | "anual_trimestral" | string;
  trimestre?: string;
  conteudos: string[] | string;
  objetivos?: string;
  observacoes?: string;
  habilidadesSelecionadas: SelectedBNCCSkill[];
};

export type PlanejamentoAIEtapa = {
  titulo: string;
  descricao: string;
  conteudos: string[];
  habilidadesBnccCodigos: string[];
  habilidadesBncc: string[];
  metodologia: string;
  recursos: string[];
  avaliacao: string;
  evidencias: string[];
};

export type PlanejamentoAIOutput = {
  titulo: string;
  resumo: string;
  dadosGerais: {
    escola: string;
    professor: string;
    etapa: string;
    anoSerie: string;
    componenteCurricular: string;
    cargaHoraria: string;
    tipo: string;
    trimestre?: string;
  };
  objetivosGerais: string[];
  habilidadesBnccUtilizadas: SelectedBNCCSkill[];
  conteudosOrganizados: string[];
  metodologiaGeral: string;
  etapas: PlanejamentoAIEtapa[];
  recursosGerais: string[];
  avaliacaoGeral: string;
  evidenciasDeAprendizagem: string[];
  observacoesPedagogicas: string[];
  proximosPassos: string[];
  alertas: string[];
};

export type MaterialAIType =
  | "atividade"
  | "prova"
  | "apostila"
  | "sequencia"
  | "jogo"
  | "projeto"
  | "roteiro"
  | string;

export type MaterialAIInput = {
  titulo: string;
  escola?: string;
  professor?: string;
  etapa: string;
  anoSerie: string;
  areaConhecimento?: string;
  componenteCurricular: string;
  tipo: MaterialAIType;
  modeloJogo?: string;
  tema: string;
  quantidadeQuestoes?: string;
  duracao?: string;
  objetivos?: string;
  conteudos: string[] | string;
  orientacoes?: string;
  observacoes?: string;
};

export type MaterialAIQuestion = {
  numero: number;
  tipo: string;
  enunciado: string;
  alternativas: string[];
  respostaEsperada: string;
  criterioCorrecao: string;
};

export type MaterialAISection = {
  titulo: string;
  conteudo: string;
  itens: string[];
  visualHtml?: string;
};


export type MaterialAIGameSeedTerm = {
  termo: string;
  resposta: string;
  pista: string;
  categoria?: string;
};

export type MaterialAIGameVisualSeed = {
  termos: MaterialAIGameSeedTerm[];
};

export type MaterialAIGame = {
  nome: string;
  tipoJogo?: string;
  objetivo: string;
  materiais: string[];
  preparacao: string[];
  regras: string[];
  modoDeJogar: string[];
  variacoes: string[];
  fechamento: string;
};

export type MaterialAIOutput = {
  titulo: string;
  subtitulo: string;
  tipo: string;
  resumo: string;
  dadosGerais: {
    escola?: string;
    professor?: string;
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
  introducao: string;
  secoes: MaterialAISection[];
  questoes: MaterialAIQuestion[];
  jogo?: MaterialAIGame;
  projeto?: {
    problemaNorteador: string;
    etapas: string[];
    produtoFinal: string;
    avaliacao: string;
  };
  roteiro?: {
    antesDoEstudo: string[];
    duranteOEstudo: string[];
    depoisDoEstudo: string[];
    autoavaliacao: string[];
  };
  criteriosAvaliacao: string[];
  gabarito: string[];
  adaptacoesInclusivas: string[];
  sugestoesUso: string[];
  alertas: string[];
  jogoVisualSeed?: MaterialAIGameVisualSeed;
  visualHtml?: string;
  printHtml?: string;
};

export type GeminiGenerateJSONOptions = {
  systemInstruction: string;
  prompt: string;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  model?: string;
};
