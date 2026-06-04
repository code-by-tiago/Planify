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

export type MaterialEngineRequest = {
  tipoMaterial: MaterialEngineType;
  etapa: string;
  anoSerie: string;
  componenteCurricular: string;
  tema: string;
  objetivo: string;
  quantidade: number;
  dificuldade: string;
  formatoJogo: string | null;
  incluirGabarito: boolean;
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
  objetivo?: string;
  objetivos?: string;
  quantidade?: string | number;
  dificuldade?: string;
  formatoJogo?: string | null;
  incluirGabarito?: boolean;
  areaConhecimento?: string;
  observacoes?: string;
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
    instructions: string;
    items: string[];
  }>;
  answerKey: string[];
  teacherNotes: string[];
  html?: string;
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
    imagePrompt?: string;
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
};
