import type { BnccSkill } from "./bncc";

export type TeachingMaterialType =
  | "activity"
  | "assessment"
  | "worksheet"
  | "lesson_sequence"
  | "pedagogical_game"
  | "project"
  | "reading_guide";

export type TeachingMaterialStatus = "draft" | "ready" | "archived";

export type TeachingMaterialSection = {
  id: string;
  title: string;
  content: string;
  order: number;
};

export type TeachingMaterial = {
  id: string;
  userId: string;
  title: string;
  type: TeachingMaterialType;
  status: TeachingMaterialStatus;
  subject: string;
  grade: string;
  schoolStage: string;
  theme: string;
  objectives: string[];
  instructions: string[];
  sections: TeachingMaterialSection[];
  bnccSkills: BnccSkill[];
  documentId?: string;
  createdAt: string;
  updatedAt: string;
};