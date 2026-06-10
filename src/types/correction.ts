export type CorrectionTone = "encorajador" | "direto" | "detalhado";
export type CorrectionRigor = "flexivel" | "balanceado" | "rigoroso";

export type TeacherCorrectionProfile = {
  tom: CorrectionTone;
  rigor: CorrectionRigor;
  foco: string[];
  exemplosFeedback: string[];
  updatedAt: string;
};

export type CorrectionCriterionResult = {
  criterio: string;
  atendido: boolean;
  pontos: number;
  pontosMaximos: number;
  comentario: string;
};

export type CorrectionAiOutput = {
  nota: number;
  notaMaxima: number;
  percentual: number;
  feedbackGeral: string;
  criterios: CorrectionCriterionResult[];
  pontosFortes: string[];
  pontosMelhoria: string[];
  sugestaoProfessor: string;
};

export const CORRECAO_GENERATION_TYPE = "correcao-ia";
