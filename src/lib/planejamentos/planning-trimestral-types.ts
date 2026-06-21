import type {
  PlanningMatrixItem,
  TrimestralSemanaPlan,
} from "@/server/planejamentos/planning-ai-service";

export type { TrimestralSemanaPlan };

export type TrimestralAulaPlan = {
  itemAnual: PlanningMatrixItem;
  funcaoAula: string;
  unidadeTematica: string;
  objetoConhecimento: string;
  habilidades: string;
  expectativas: string;
  projetos: string;
  semanas: TrimestralSemanaPlan[];
};

export type TrimestralPlanoValidado = {
  trimestre: number;
  aulas: TrimestralAulaPlan[];
  validadoEm: string;
  maxSimilaridade: number;
};

export type PlanningMatrixItemWithSemanas = PlanningMatrixItem & {
  semanas?: TrimestralSemanaPlan[];
  funcaoAula?: string;
};
