import type { BnccSkill } from "./bncc";

export type PlanningType = "annual" | "quarterly";

export type SchoolStage =
  | "educacao_infantil"
  | "ensino_fundamental_anos_iniciais"
  | "ensino_fundamental_anos_finais"
  | "ensino_medio";

export type PlanningStatus = "draft" | "ready" | "archived";

export type PlanningQuarter = "1" | "2" | "3";

export type PlanningContentBlock = {
  id: string;
  lessonRange: string;
  knowledgeObject: string;
  contents: string[];
  objectives: string[];
  methodology: string;
  resources: string[];
  evaluation: string;
  evidence: string;
  bnccSkills: BnccSkill[];
};

export type Planning = {
  id: string;
  userId: string;
  type: PlanningType;
  status: PlanningStatus;
  title: string;
  schoolName: string;
  teacherName: string;
  subject: string;
  grade: string;
  schoolStage: SchoolStage;
  workload: string;
  academicYear: string;
  quarter?: PlanningQuarter;
  theme?: string;
  contents: PlanningContentBlock[];
  documentId?: string;
  createdAt: string;
  updatedAt: string;
};