import type {
  BnccCoveredSkill,
  BnccProgressResponse,
  BnccSkillSummary,
  SchoolClassBnccRow,
  SchoolDashboardResponse,
} from "@/lib/bncc/types";
import {
  DEFAULT_SCHOOL_YEAR,
  matchesDisciplineFilter,
  resolveBnccCatalogSubjects,
} from "./discipline-catalog";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getUserSchoolContext } from "../schools/school-service";

type BnccSkillRow = {
  code: string;
  description: string;
  subject: string | null;
  grade: string | null;
  education_stage: string | null;
};

type GeneratedMaterialRow = {
  id: string;
  title: string;
  bncc_skill_codes: string[];
  created_at: string;
  class_id: string | null;
  class_name: string | null;
  discipline: string | null;
  user_id: string;
  school_year: number | null;
};

const PERSONAL_CLASS_PREFIX = "cn:";

export function encodePersonalClassFilter(className: string): string {
  return `${PERSONAL_CLASS_PREFIX}${className}`;
}

export function decodePersonalClassFilter(
  value: string | null | undefined,
): { classId: string | null; className: string | null } {
  const raw = String(value || "").trim();
  if (!raw) {
    return { classId: null, className: null };
  }
  if (raw.startsWith(PERSONAL_CLASS_PREFIX)) {
    return {
      classId: null,
      className: raw.slice(PERSONAL_CLASS_PREFIX.length).trim() || null,
    };
  }
  return { classId: raw, className: null };
}

type SchoolClassRow = {
  id: string;
  name: string;
  grade_level: string | null;
  discipline: string | null;
  year: number | null;
};

function toSkillSummary(row: BnccSkillRow): BnccSkillSummary {
  return {
    code: row.code,
    description: row.description,
    subject: row.subject,
    grade: row.grade,
    educationStage: row.education_stage,
  };
}

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function normalizeFilterText(value: string | null | undefined): string {
  return String(value || "").trim();
}

async function fetchDistinctDisciplines(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("generated_materials")
    .select("discipline,bncc_skill_codes,request_payload")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const values = new Set<string>();
  const orphanCodes = new Set<string>();

  for (const row of data || []) {
    const material = row as {
      discipline?: string | null;
      bncc_skill_codes?: string[] | null;
      request_payload?: Record<string, unknown> | null;
    };

    const storedDiscipline = String(material.discipline || "").trim();
    if (storedDiscipline) {
      values.add(storedDiscipline);
      continue;
    }

    const payload = material.request_payload;
    const payloadDiscipline = String(
      payload?.componenteCurricular ||
        payload?.componente ||
        payload?.disciplina ||
        payload?.discipline ||
        "",
    ).trim();
    if (payloadDiscipline) {
      values.add(payloadDiscipline);
      continue;
    }

    for (const code of material.bncc_skill_codes || []) {
      const normalized = String(code || "").trim().toUpperCase();
      if (normalized) orphanCodes.add(normalized);
    }
  }

  if (orphanCodes.size > 0) {
    const catalogSkills = await fetchCatalogSkillsByCodes(
      Array.from(orphanCodes),
    );
    for (const skill of catalogSkills) {
      if (skill.subject?.trim()) {
        values.add(skill.subject.trim());
      }
    }
  }

  return Array.from(values).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

async function fetchCatalogSkills(filters: {
  grade?: string | null;
  discipline?: string | null;
}): Promise<BnccSkillRow[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("bncc_skills")
    .select("code,description,subject,grade,education_stage")
    .eq("is_active", true);

  if (filters.grade) {
    query = query.eq("grade", filters.grade);
  }

  if (filters.discipline) {
    const subjects = resolveBnccCatalogSubjects(filters.discipline);
    if (subjects.length === 1) {
      query = query.ilike("subject", subjects[0]);
    } else if (subjects.length > 1) {
      query = query.or(
        subjects.map((subject) => `subject.ilike.${subject}`).join(","),
      );
    }
  }

  const { data, error } = await query.order("code", { ascending: true });

  if (error) {
    const message = error.message || "";
    if (
      message.includes("bncc_skills") ||
      message.includes("schema cache") ||
      error.code === "42P01"
    ) {
      console.warn("planify:bncc_skills unavailable, returning empty catalog", message);
      return [];
    }
    throw new Error(message);
  }

  return (data || []) as BnccSkillRow[];
}

async function fetchCatalogSkillsByCodes(
  codes: string[],
): Promise<BnccSkillRow[]> {
  const normalized = Array.from(
    new Set(codes.map((code) => String(code).trim().toUpperCase()).filter(Boolean)),
  );

  if (normalized.length === 0) {
    return [];
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bncc_skills")
    .select("code,description,subject,grade,education_stage")
    .eq("is_active", true)
    .in("code", normalized)
    .order("code", { ascending: true });

  if (error) {
    const message = error.message || "";
    if (
      message.includes("bncc_skills") ||
      message.includes("schema cache") ||
      error.code === "42P01"
    ) {
      return [];
    }
    throw new Error(message);
  }

  return (data || []) as BnccSkillRow[];
}

function mergeCatalogSkills(...groups: BnccSkillRow[][]): BnccSkillRow[] {
  const byCode = new Map<string, BnccSkillRow>();
  for (const group of groups) {
    for (const skill of group) {
      byCode.set(skill.code.toUpperCase(), skill);
    }
  }
  return Array.from(byCode.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );
}

async function fetchUserMaterials(
  userId: string,
  filters: {
    classId?: string | null;
    className?: string | null;
    discipline?: string | null;
    schoolYear?: number;
  },
): Promise<GeneratedMaterialRow[]> {
  const supabase = getSupabaseAdminClient();
  const schoolYear = filters.schoolYear ?? DEFAULT_SCHOOL_YEAR;
  let query = supabase
    .from("generated_materials")
    .select(
      "id,title,bncc_skill_codes,created_at,class_id,class_name,discipline,user_id,school_year",
    )
    .eq("user_id", userId)
    .eq("school_year", schoolYear)
    .order("created_at", { ascending: false });

  if (filters.classId) {
    query = query.eq("class_id", filters.classId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  let rows = (data || []) as GeneratedMaterialRow[];

  if (filters.className) {
    rows = rows.filter((row) =>
      matchesFilterText(row.class_name, filters.className),
    );
  }

  if (filters.discipline) {
    rows = rows.filter((row) =>
      matchesDisciplineFilter(row.discipline, filters.discipline),
    );
  }

  return rows;
}

async function fetchDistinctClassNames(userId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("generated_materials")
    .select("class_name")
    .eq("user_id", userId)
    .not("class_name", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const names = new Set<string>();
  for (const row of data || []) {
    const name = String(
      (row as { class_name?: string | null }).class_name || "",
    ).trim();
    if (name) names.add(name);
  }

  return Array.from(names).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function matchesFilterText(
  stored: string | null | undefined,
  filter: string | null | undefined,
): boolean {
  const expected = normalizeFilterText(filter);
  if (!expected) return true;
  const actual = normalizeFilterText(stored);
  return actual.toLowerCase() === expected.toLowerCase();
}

async function fetchSchoolMaterials(
  schoolId: string,
  filters: { classId?: string | null; since?: string | null },
): Promise<GeneratedMaterialRow[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("generated_materials")
    .select("id,title,bncc_skill_codes,created_at,class_id,user_id")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  if (filters.classId) {
    query = query.eq("class_id", filters.classId);
  }

  if (filters.since) {
    query = query.gte("created_at", filters.since);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as GeneratedMaterialRow[];
}

function buildCoverage(
  catalog: BnccSkillRow[],
  materials: GeneratedMaterialRow[],
): {
  covered: BnccCoveredSkill[];
  pending: BnccSkillSummary[];
  coveragePercent: number;
} {
  const catalogByCode = new Map(
    catalog.map((skill) => [skill.code.toUpperCase(), skill]),
  );
  const coveredMap = new Map<string, BnccCoveredSkill>();

  for (const material of materials) {
    for (const rawCode of material.bncc_skill_codes || []) {
      const code = String(rawCode).trim().toUpperCase();
      const skill = catalogByCode.get(code);
      if (!skill || coveredMap.has(code)) continue;

      coveredMap.set(code, {
        ...toSkillSummary(skill),
        coveredAt: material.created_at,
        materialId: material.id,
        materialTitle: material.title,
      });
    }
  }

  const covered = Array.from(coveredMap.values()).sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  const pending = catalog
    .filter((skill) => !coveredMap.has(skill.code.toUpperCase()))
    .map(toSkillSummary);

  const totalSkills = catalog.length;
  const coveredCount = covered.length;
  const rawPercent =
    totalSkills > 0 ? (coveredCount / totalSkills) * 100 : 0;
  const coveragePercent =
    coveredCount > 0 && rawPercent > 0 && rawPercent < 1
      ? 1
      : Math.round(rawPercent);

  return { covered, pending, coveragePercent };
}

export async function getTeacherBnccProgress(
  userId: string,
  filters: {
    classFilter?: string | null;
    discipline?: string | null;
  } = {},
): Promise<BnccProgressResponse> {
  const context = await getUserSchoolContext(userId);
  const schoolClasses = (context.classes || []) as SchoolClassRow[];

  const classFilter = decodePersonalClassFilter(filters.classFilter);

  const selectedSchoolClass = classFilter.classId
    ? schoolClasses.find((row) => row.id === classFilter.classId) || null
    : null;

  const selectedPersonalClassName = classFilter.className;

  const grade = selectedSchoolClass?.grade_level || null;
  const year = selectedSchoolClass?.year ?? DEFAULT_SCHOOL_YEAR;
  const discipline =
    filters.discipline?.trim() ||
    selectedSchoolClass?.discipline?.trim() ||
    null;

  const materials = await fetchUserMaterials(userId, {
    classId: classFilter.classId,
    className: classFilter.className,
    discipline: filters.discipline?.trim() || null,
    schoolYear: year,
  });

  const materialCodes = materials.flatMap(
    (material) => material.bncc_skill_codes || [],
  );

  const explicitDiscipline = filters.discipline?.trim() || null;
  const hasNarrowCatalog = Boolean(grade || explicitDiscipline);

  const materialDisciplineValues = Array.from(
    new Set(
      materials
        .map((material) => material.discipline?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const catalog = hasNarrowCatalog
    ? mergeCatalogSkills(
        await fetchCatalogSkills({ grade, discipline: explicitDiscipline }),
        await fetchCatalogSkillsByCodes(materialCodes),
      )
    : materials.length > 0
      ? mergeCatalogSkills(
          await fetchCatalogSkillsByCodes(materialCodes),
          ...(await Promise.all(
            materialDisciplineValues.map((value) =>
              fetchCatalogSkills({ discipline: value }),
            ),
          )),
        )
      : await fetchCatalogSkills({});

  const { covered, pending, coveragePercent } = buildCoverage(
    catalog,
    materials,
  );

  const [personalClassNames, materialDisciplines] = await Promise.all([
    fetchDistinctClassNames(userId),
    fetchDistinctDisciplines(userId),
  ]);

  const schoolClassNames = new Set(
    schoolClasses.map((row) => row.name.trim().toLowerCase()),
  );

  const classOptions = [
    ...schoolClasses.map((row) => ({
      id: row.id,
      name: row.name,
      gradeLevel: row.grade_level,
      discipline: row.discipline,
      year: row.year,
    })),
    ...personalClassNames
      .filter((name) => !schoolClassNames.has(name.trim().toLowerCase()))
      .map((name) => ({
        id: encodePersonalClassFilter(name),
        name,
        gradeLevel: null as string | null,
        discipline: null as string | null,
        year: null as number | null,
      })),
  ];

  const disciplineSet = new Set<string>();
  for (const cls of schoolClasses) {
    if (cls.discipline?.trim()) disciplineSet.add(cls.discipline.trim());
  }
  for (const value of materialDisciplines) {
    disciplineSet.add(value);
    for (const alias of resolveBnccCatalogSubjects(value)) {
      if (alias.trim()) disciplineSet.add(alias.trim());
    }
  }
  for (const skill of catalog) {
    if (skill.subject?.trim()) disciplineSet.add(skill.subject.trim());
  }

  return {
    coveragePercent,
    totalSkills: catalog.length,
    coveredCount: covered.length,
    pendingCount: pending.length,
    covered,
    pending,
    classes: classOptions,
    disciplines: Array.from(disciplineSet).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    ),
    filters: {
      classFilter: filters.classFilter || null,
      classId: classFilter.classId,
      className: classFilter.className,
      discipline,
      grade,
      year,
    },
  };
}

async function resolveTeacherName(userId: string | null): Promise<string | null> {
  if (!userId) return null;

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name,email")
    .eq("id", userId)
    .maybeSingle();

  const profile = data as { full_name?: string | null; email?: string | null } | null;
  const name = String(profile?.full_name || "").trim();
  if (name) return name;
  const email = String(profile?.email || "").trim();
  return email || null;
}

export async function getSchoolDashboardMetrics(
  schoolId: string,
): Promise<SchoolDashboardResponse> {
  const supabase = getSupabaseAdminClient();

  const [{ data: school }, members, classes, monthMaterials] = await Promise.all([
    supabase.from("schools").select("id,name").eq("id", schoolId).maybeSingle(),
    supabase
      .from("school_memberships")
      .select("user_id,role,status")
      .eq("school_id", schoolId)
      .eq("status", "active"),
    supabase
      .from("school_classes")
      .select("id,name,grade_level,discipline,year")
      .eq("school_id", schoolId)
      .order("name", { ascending: true }),
    fetchSchoolMaterials(schoolId, { since: startOfMonthIso() }),
  ]);

  if (!school) {
    throw new Error("Escola não encontrada.");
  }

  const activeTeachers = (members.data || []).filter(
    (row) => (row as { role: string }).role === "teacher",
  ).length;

  const allMaterials = await fetchSchoolMaterials(schoolId, {});
  const teacherByClass = new Map<string, string>();

  for (const material of allMaterials) {
    if (!material.class_id || teacherByClass.has(material.class_id)) continue;
    teacherByClass.set(material.class_id, material.user_id);
  }

  const classRows = (classes.data || []) as SchoolClassRow[];
  const classMetrics: SchoolClassBnccRow[] = [];

  for (const cls of classRows) {
    const catalog = await fetchCatalogSkills({
      grade: cls.grade_level,
      discipline: cls.discipline,
    });

    const classMaterials = allMaterials.filter(
      (material) => material.class_id === cls.id,
    );

    const { covered, coveragePercent } = buildCoverage(catalog, classMaterials);
    const materialsThisMonth = monthMaterials.filter(
      (material) => material.class_id === cls.id,
    ).length;

    const teacherUserId = teacherByClass.get(cls.id) || null;
    const teacherName = await resolveTeacherName(teacherUserId);

    classMetrics.push({
      classId: cls.id,
      className: cls.name,
      gradeLevel: cls.grade_level,
      discipline: cls.discipline,
      teacherName,
      coveragePercent,
      coveredCount: covered.length,
      totalSkills: catalog.length,
      materialsThisMonth,
    });
  }

  const avgBnccCompliance =
    classMetrics.length > 0
      ? Math.round(
          classMetrics.reduce((sum, row) => sum + row.coveragePercent, 0) /
            classMetrics.length,
        )
      : 0;

  return {
    schoolId,
    schoolName: String((school as { name: string }).name),
    activeTeachers,
    avgBnccCompliance,
    materialsThisMonth: monthMaterials.length,
    classes: classMetrics,
  };
}
