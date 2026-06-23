export const MATERIAL_ENGINE_TYPES = [
  "apostila",
  "atividade",
  "prova",
  "slides",
  "projeto",
  "jogo",
  "sequencia",
  "resumo",
  "lista",
  "plano-aula",
  "flashcards",
  "redacao",
  "mapa-mental",
  "cruzadinha",
] as const;

export type MaterialEngineType = (typeof MATERIAL_ENGINE_TYPES)[number];

export const SLIDE_LAYOUTS = [
  "capa",
  "conteudo",
  "duasColunas",
  "destaque",
  "fechamento",
] as const;

export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

export const SLIDE_ACCENTS = [
  "indigo",
  "violet",
  "coral",
  "amber",
  "emerald",
  "sky",
  "rose",
] as const;

export type SlideAccent = (typeof SLIDE_ACCENTS)[number];

/** @deprecated Ignored by server — bank-first pipeline is always internal. */
export type MaterialGenerationMode = "hibrido" | "banco" | "ia";

export type MaterialEngineRequest = {
  tipoMaterial: MaterialEngineType;
  etapa: string;
  anoSerie: string;
  componenteCurricular: string;
  tema: string;
  conteudo: string;
  objetivo: string;
  quantidade: number;
  dificuldade: string;
  formatoJogo: string | null;
  incluirGabarito: boolean;
  /** Slides: incluir questões de checagem/prática na apresentação. */
  incluirQuestoes?: boolean;
  /** Slides com questões: quantidade de questões (independente do total de slides). */
  quantidadeQuestoes?: number;
  modeloSlides?: string;
  designSlides?: string;
  observacoes?: string;
  elevarQualidade?: boolean;
  problemasQualidade?: string[];
  habilidadesSelecionadas?: Array<{
    codigo: string;
    descricao: string;
    conteudo?: string;
  }>;
};

export type MaterialEngineInput = {
  tipoMaterial?: string;
  tipo?: string;
  etapa?: string;
  anoSerie?: string;
  componenteCurricular?: string;
  componente?: string;
  tema?: string;
  temaCentral?: string;
  conteudo?: string;
  objetivo?: string;
  objetivos?: string;
  quantidade?: string | number;
  dificuldade?: string;
  formatoJogo?: string | null;
  incluirGabarito?: boolean;
  incluirQuestoes?: boolean;
  quantidadeQuestoes?: string | number;
  areaConhecimento?: string;
  observacoes?: string;
  modeloSlides?: string;
  designSlides?: string;
  elevarQualidade?: boolean;
  problemasQualidade?: string[];
  /** @deprecated Ignored — lista/prova always use internal bank-first pipeline. */
  modoGeracao?: MaterialGenerationMode;
  idempotencyKey?: string;
  idempotency_key?: string;
  classId?: string | null;
  className?: string | null;
  turma?: string | null;
  discipline?: string | null;
  disciplina?: string | null;
  habilidadesSelecionadas?: Array<{
    codigo: string;
    descricao: string;
    etapa?: string;
    anoSerie?: string;
    area?: string;
    componente?: string;
    conteudo?: string;
  }>;
  habilidadesBncc?: Array<{
    codigo: string;
    descricao: string;
    etapa?: string;
    anoSerie?: string;
    area?: string;
    componente?: string;
    conteudo?: string;
  }>;
};

export type ExamQuestion = {
  number: number;
  type: string;
  statement: string;
  options: string[];
  answer: string;
};

export type MindMapBranch = {
  title: string;
  items: string[];
};

export type LessonPlanStep = {
  stage: string;
  duration: string;
  description: string;
  resources: string[];
};

/** Tabela cronometrada (plano de aula, sequência, projeto). */
export type ScheduleTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type MaterialEngineResponse = {
  title: string;
  subtitle: string;
  summary: string;
  sections: Array<{
    title: string;
    content: string;
    bullets: string[];
  }>;
  activities: Array<{
    title: string;
    objective?: string;
    estimatedTime?: string;
    materials?: string[];
    instructions: string;
    items: string[];
    evaluation?: string;
  }>;
  answerKey: string[];
  teacherNotes: string[];
  html?: string;
  /** Tema visual escolhido para a apresentação (aplicado no render e na exportação). */
  slideTheme?: string;
  game?: {
    format: string;
    rules: string[];
    components: string[];
  };
  slides?: Array<{
    title: string;
    bullets: string[];
    speakerNotes: string;
    /** Campos visuais opcionais (V2) — retrocompatíveis com slides antigos. */
    layout?: SlideLayout;
    subtitle?: string;
    /** Termos de busca para imagem real (não exibido ao professor). */
    imagePrompt?: string;
    /** URL resolvida no servidor (Wikimedia/Unsplash). */
    imageUrl?: string;
    imageAlt?: string;
    /** Ordem pedagógica do slide na sequência de ensino (1, 2, 3…). */
    sequenceStep?: number;
    /** Rótulo da etapa (ex.: "Objetivos", "Desenvolvimento 2"). */
    sequenceLabel?: string;
    accentColor?: SlideAccent;
    iconHint?: string;
    callout?: {
      title?: string;
      text?: string;
    };
  }>;
  flashcards?: Array<{
    front: string;
    back: string;
  }>;
  exam?: {
    questions: ExamQuestion[];
  };
  mindMap?: {
    central: string;
    branches: MindMapBranch[];
  };
  lessonPlan?: {
    steps: LessonPlanStep[];
  };
  /** Cronogramas em tabela HTML — prioridade sobre lessonPlan.steps na renderização. */
  scheduleTables?: ScheduleTable[];
};
