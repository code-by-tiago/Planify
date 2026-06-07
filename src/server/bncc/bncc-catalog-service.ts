import "server-only";

import type { Json, TablesInsert } from "@/types/database";
import type { BNCCSkill, BNCCStage } from "@/types/bncc";
import { EDUCATION_OPTIONS } from "@/lib/educacao/education-options";
import {
  EXTRA_CATALOG_SUBJECTS,
  normalizeDisciplineKey,
} from "./discipline-catalog";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export type BnccCatalogOptions = {
  stages: string[];
  grades: string[];
  subjects: string[];
  knowledgeAreas: string[];
  totalSkills: number;
};

type BnccSkillRow = {
  code: string;
  description: string;
  education_stage: string;
  grade: string | null;
  subject: string | null;
  knowledge_area: string | null;
  thematic_unit: string | null;
  knowledge_object: string | null;
  keywords: string[] | null;
  is_active: boolean;
};

let cachedSkills: BNCCSkill[] | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeStageCode(value: string, code = ""): BNCCStage {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (normalized.includes("fundamental") || code.toUpperCase().startsWith("EF")) {
    return "ensino_fundamental";
  }
  if (
    normalized.includes("medio") ||
    normalized.includes("médio") ||
    code.toUpperCase().startsWith("EM")
  ) {
    return "ensino_medio";
  }
  if (normalized.includes("infantil") || code.toUpperCase().startsWith("EI")) {
    return "educacao_infantil";
  }
  return "unknown";
}

export function toEducationStageLabel(value: string, code = ""): string {
  const stage = normalizeStageCode(value, code);
  if (stage === "ensino_fundamental") return "Ensino Fundamental";
  if (stage === "ensino_medio") return "Ensino Médio";
  if (stage === "educacao_infantil") return "Educação Infantil";
  return value.trim() || "Ensino Fundamental";
}

function rowToBnccSkill(row: BnccSkillRow): BNCCSkill {
  const code = row.code.trim().toUpperCase();
  return {
    id: code,
    codigo: code,
    descricao: row.description,
    etapa: normalizeStageCode(row.education_stage, code),
    ano: row.grade || undefined,
    serie: row.grade || undefined,
    componente: row.subject || undefined,
    areaConhecimento: row.knowledge_area || undefined,
    unidadeTematica: row.thematic_unit || undefined,
    objetoConhecimento: row.knowledge_object || undefined,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    fonte: "bncc_skills",
  };
}

export function jsonSkillToInsertRow(
  item: Record<string, unknown>,
): TablesInsert<"bncc_skills"> | null {
  const code = String(item.codigo || item.code || item.id || "")
    .trim()
    .toUpperCase();
  const description = String(item.descricao || item.description || "").trim();

  if (!code || !description) {
    return null;
  }

  const etapaRaw = String(
    item.etapa || item.educationStage || item.nivel || "",
  ).trim();
  const grade = String(item.ano || item.grade || item.serie || "").trim() || null;
  const subject =
    String(
      item.componente || item.componenteCurricular || item.subject || "",
    ).trim() || null;
  const knowledgeArea =
    String(item.areaConhecimento || item.knowledgeArea || "").trim() || null;
  const thematicUnit =
    String(item.unidadeTematica || item.thematicUnit || "").trim() || null;
  const knowledgeObject =
    String(item.objetoConhecimento || item.knowledgeObject || "").trim() ||
    null;
  const keywords = Array.isArray(item.keywords)
    ? (item.keywords as unknown[]).map((k) => String(k).trim()).filter(Boolean)
    : [];

  return {
    code,
    description,
    education_stage: toEducationStageLabel(etapaRaw, code),
    grade,
    subject,
    knowledge_area: knowledgeArea,
    thematic_unit: thematicUnit,
    knowledge_object: knowledgeObject,
    keywords,
    metadata: {} as Json,
    is_active: true,
  };
}

export async function countBnccSkillsInDb(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("bncc_skills")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

export async function fetchBnccSkillsFromDb(filters?: {
  stage?: string | null;
  grade?: string | null;
  subject?: string | null;
}): Promise<BNCCSkill[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("bncc_skills")
    .select(
      "code,description,education_stage,grade,subject,knowledge_area,thematic_unit,knowledge_object,keywords,is_active",
    )
    .eq("is_active", true);

  if (filters?.stage) {
    query = query.eq("education_stage", filters.stage);
  }
  if (filters?.grade) {
    query = query.eq("grade", filters.grade);
  }
  if (filters?.subject) {
    query = query.ilike("subject", filters.subject);
  }

  const { data, error } = await query.order("code", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as BnccSkillRow[]).map(rowToBnccSkill);
}

export async function getCachedBnccSkills(): Promise<BNCCSkill[]> {
  const now = Date.now();
  if (cachedSkills && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedSkills;
  }

  const skills = await fetchBnccSkillsFromDb();
  cachedSkills = skills;
  cacheLoadedAt = now;
  return skills;
}

export function invalidateBnccSkillsCache(): void {
  cachedSkills = null;
  cacheLoadedAt = 0;
}

async function fetchDistinctColumn(
  column: "education_stage" | "grade" | "subject" | "knowledge_area",
  filters?: { stage?: string | null; grade?: string | null },
): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("bncc_skills")
    .select(column)
    .eq("is_active", true)
    .not(column, "is", null);

  if (filters?.stage && column !== "education_stage") {
    query = query.eq("education_stage", filters.stage);
  }
  if (filters?.grade && column !== "grade") {
    query = query.eq("grade", filters.grade);
  }

  const { data, error } = await query.order(column, { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const values = new Set<string>();
  for (const row of data || []) {
    const value = String((row as Record<string, unknown>)[column] || "").trim();
    if (value) values.add(value);
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function collectEducationComponents(): string[] {
  const values = new Set<string>(EXTRA_CATALOG_SUBJECTS);

  for (const stage of Object.values(EDUCATION_OPTIONS)) {
    for (const components of Object.values(stage.componentsByArea)) {
      for (const component of components) {
        values.add(component);
      }
    }
  }

  return Array.from(values);
}

function mergeCatalogSubjects(dbSubjects: string[]): string[] {
  const merged = new Map<string, string>();

  for (const subject of [...dbSubjects, ...collectEducationComponents()]) {
    const trimmed = String(subject || "").trim();
    if (!trimmed) continue;
    merged.set(normalizeDisciplineKey(trimmed), trimmed);
  }

  return Array.from(merged.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export async function getBnccCatalogOptions(filters?: {
  stage?: string | null;
  grade?: string | null;
}): Promise<BnccCatalogOptions> {
  const [stages, grades, subjects, knowledgeAreas, totalSkills] =
    await Promise.all([
      fetchDistinctColumn("education_stage"),
      fetchDistinctColumn("grade", { stage: filters?.stage }),
      fetchDistinctColumn("subject", {
        stage: filters?.stage,
        grade: filters?.grade,
      }),
      fetchDistinctColumn("knowledge_area", { stage: filters?.stage }),
      countBnccSkillsInDb(),
    ]);

  return {
    stages,
    grades,
    subjects: mergeCatalogSubjects(subjects),
    knowledgeAreas,
    totalSkills,
  };
}

export async function upsertBnccSkillRows(
  rows: TablesInsert<"bncc_skills">[],
): Promise<{ inserted: number; errors: number }> {
  const supabase = getSupabaseAdminClient();
  let inserted = 0;
  let errors = 0;
  const batchSize = 100;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("bncc_skills").upsert(batch, {
      onConflict: "code",
      ignoreDuplicates: false,
    });

    if (error) {
      errors += batch.length;
      console.warn("bncc import batch error", error.message);
    } else {
      inserted += batch.length;
    }
  }

  invalidateBnccSkillsCache();
  return { inserted, errors };
}
