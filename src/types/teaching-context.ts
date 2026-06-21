export type TeacherTeachingContext = {
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componente: string;
  turma: string;
  classId: string | null;
  observacoesTurma: string;
  updatedAt: string;
};

export type TeachingContextFields = Pick<
  TeacherTeachingContext,
  "etapa" | "anoSerie" | "areaConhecimento" | "componente" | "turma" | "classId" | "observacoesTurma"
>;

export const DEFAULT_TEACHING_CONTEXT: TeacherTeachingContext = {
  etapa: "",
  anoSerie: "",
  areaConhecimento: "",
  componente: "",
  turma: "",
  classId: null,
  observacoesTurma: "",
  updatedAt: new Date(0).toISOString(),
};
