import type { Json } from "./database";

export type GeneratedMaterialSurface = "material" | "planning" | "inclusao";

export type PersistGeneratedMaterialInput = {
  userId: string;
  schoolId?: string | null;
  classId?: string | null;
  className?: string | null;
  discipline?: string | null;
  tipo: string;
  title: string;
  bnccSkillCodes: string[];
  bnccSkills?: Json;
  contentPreview?: string;
  contentHtml?: string | null;
  raw: Json;
  pipeline?: string | null;
  qualityScore?: number | null;
  surface: GeneratedMaterialSurface;
};

export type GeneratedMaterialListFilters = {
  bnccCode?: string;
  surface?: GeneratedMaterialSurface;
  tipo?: string;
  classId?: string;
  limit?: number;
  offset?: number;
};
