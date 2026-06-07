import type { Json, TablesInsert, TablesUpdate } from "@/types/database";
import type {
  CreateSchoolClassInput,
  CreateSchoolInput,
  CreateSchoolMemberInput,
  SchoolContext,
  UpdateSchoolClassInput,
} from "@/types/school";
import type { GeneratedMaterialListFilters } from "@/types/generated-material";
import type {
  SchoolClassItem,
  SchoolMaterialAuditRow,
  SchoolMaterialsResponse,
} from "@/lib/school/types";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import {
  getPrimarySchoolIdForUser,
  isSchoolManagerProfile,
  isSiteAdminUser,
} from "./school-access";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function listSchoolsForUser(userId: string) {
  const supabase = getSupabaseAdminClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("school_memberships")
    .select("school_id,role,status")
    .eq("user_id", userId)
    .eq("status", "active");

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const schoolIds = Array.from(
    new Set((memberships || []).map((row) => String((row as { school_id: string }).school_id))),
  );

  if (schoolIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .in("id", schoolIds)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((school) => {
    const membership = (memberships || []).find(
      (row) => (row as { school_id: string }).school_id === (school as { id: string }).id,
    ) as { role: string; status: string } | undefined;

    return {
      ...(school as Record<string, unknown>),
      membershipRole: membership?.role || null,
      membershipStatus: membership?.status || null,
    };
  });
}

export async function createSchool(
  ownerUserId: string,
  input: CreateSchoolInput,
) {
  const supabase = getSupabaseAdminClient();
  const name = String(input.name || "").trim();

  if (!name) {
    throw new Error("Informe o nome da escola.");
  }

  const slug = input.slug?.trim() || slugify(name) || null;

  const schoolRow: TablesInsert<"schools"> = {
    name,
    slug,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    metadata: (input.metadata || {}) as Json,
    director_user_id: ownerUserId,
  };

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .insert(schoolRow)
    .select("*")
    .single();

  if (schoolError || !school) {
    throw new Error(schoolError?.message || "Não foi possível criar a escola.");
  }

  const membershipRow: TablesInsert<"school_memberships"> = {
    school_id: (school as { id: string }).id,
    user_id: ownerUserId,
    role: "director",
    status: "active",
  };

  const { error: membershipError } = await supabase
    .from("school_memberships")
    .insert(membershipRow);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  return school;
}

export async function listSchoolClasses(schoolId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("school_classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function createSchoolClass(
  schoolId: string,
  input: CreateSchoolClassInput,
) {
  const supabase = getSupabaseAdminClient();
  const name = String(input.name || "").trim();

  if (!name) {
    throw new Error("Informe o nome da turma.");
  }

  const classRow: TablesInsert<"school_classes"> = {
    school_id: schoolId,
    name,
    grade_level: input.gradeLevel?.trim() || null,
    year: input.year ?? null,
    discipline: input.discipline?.trim() || null,
    teacher_user_id: input.teacherUserId || null,
  };

  const { data, error } = await supabase
    .from("school_classes")
    .insert(classRow)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível criar a turma.");
  }

  return data;
}

async function resolveAuthEmails(userIds: string[]): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const result = new Map<string, string>();

  if (uniqueIds.length === 0) {
    return result;
  }

  const supabase = getSupabaseAdminClient();
  await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (!error && data?.user?.email) {
        result.set(userId, String(data.user.email).trim());
      }
    }),
  );

  return result;
}

async function resolveMemberProfiles(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const profilesById = new Map<
    string,
    { email: string | null; fullName: string | null; schoolName: string | null }
  >();

  if (uniqueIds.length === 0) {
    return profilesById;
  }

  const supabase = getSupabaseAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,email,full_name,school_name")
    .in("id", uniqueIds);

  for (const profile of profiles || []) {
    const row = profile as {
      id: string;
      email?: string | null;
      full_name?: string | null;
      school_name?: string | null;
    };
    profilesById.set(String(row.id), {
      email: row.email ? String(row.email).trim() : null,
      fullName: row.full_name ? String(row.full_name).trim() : null,
      schoolName: row.school_name ? String(row.school_name).trim() : null,
    });
  }

  const authEmails = await resolveAuthEmails(uniqueIds);
  for (const userId of uniqueIds) {
    const existing = profilesById.get(userId) || {
      email: null,
      fullName: null,
      schoolName: null,
    };
    if (!existing.email && authEmails.has(userId)) {
      existing.email = authEmails.get(userId) || null;
    }
    profilesById.set(userId, existing);
  }

  return profilesById;
}

export async function updateSchoolClass(
  schoolId: string,
  classId: string,
  input: UpdateSchoolClassInput,
) {
  const supabase = getSupabaseAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("school_classes")
    .select("id")
    .eq("id", classId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    throw new Error("Turma não encontrada.");
  }

  const updates: TablesUpdate<"school_classes"> = {};

  if (input.name !== undefined) {
    const name = String(input.name || "").trim();
    if (!name) {
      throw new Error("Informe o nome da turma.");
    }
    updates.name = name;
  }

  if (input.gradeLevel !== undefined) {
    updates.grade_level = input.gradeLevel?.trim() || null;
  }

  if (input.year !== undefined) {
    updates.year = input.year ?? null;
  }

  if (input.discipline !== undefined) {
    updates.discipline = input.discipline?.trim() || null;
  }

  if (input.teacherUserId !== undefined) {
    updates.teacher_user_id = input.teacherUserId || null;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("Nenhum campo para atualizar.");
  }

  const { data, error } = await supabase
    .from("school_classes")
    .update(updates)
    .eq("id", classId)
    .eq("school_id", schoolId)
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível atualizar a turma.");
  }

  return data;
}

export async function listSchoolClassesEnriched(
  schoolId: string,
): Promise<SchoolClassItem[]> {
  const classes = await listSchoolClasses(schoolId);
  const teacherIds = classes
    .map((row) => String((row as { teacher_user_id?: string | null }).teacher_user_id || ""))
    .filter(Boolean);
  const profilesById = await resolveMemberProfiles(teacherIds);

  return classes.map((row) => {
    const cls = row as {
      id: string;
      name: string;
      grade_level: string | null;
      year: number | null;
      discipline: string | null;
      teacher_user_id: string | null;
      created_at: string;
    };
    const teacherId = cls.teacher_user_id ? String(cls.teacher_user_id) : null;
    const profile = teacherId ? profilesById.get(teacherId) : null;
    const teacherEmail = profile?.email || null;
    const teacherName =
      profile?.fullName || teacherEmail || (teacherId ? "Professor" : null);

    return {
      id: String(cls.id),
      name: String(cls.name),
      gradeLevel: cls.grade_level,
      year: cls.year,
      discipline: cls.discipline,
      teacherUserId: teacherId,
      teacherName,
      teacherEmail,
      createdAt: String(cls.created_at),
    };
  });
}

export async function listSchoolMembers(schoolId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("school_memberships")
    .select("id,school_id,user_id,role,status,created_at,updated_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data || [];
  const userIds = rows.map((row) => (row as { user_id: string }).user_id);
  const profilesById = await resolveMemberProfiles(userIds);

  return rows.map((row) => {
    const userId = String((row as { user_id: string }).user_id);
    const profile = profilesById.get(userId);

    return {
      ...(row as Record<string, unknown>),
      profile: profile
        ? {
            email: profile.email,
            fullName: profile.fullName,
            schoolName: profile.schoolName,
          }
        : null,
    };
  });
}

export async function createSchoolMember(
  schoolId: string,
  input: CreateSchoolMemberInput,
) {
  const supabase = getSupabaseAdminClient();

  const memberRow: TablesInsert<"school_memberships"> = {
    school_id: schoolId,
    user_id: input.userId,
    role: input.role,
    status: input.status || "active",
  };

  const { data, error } = await supabase
    .from("school_memberships")
    .upsert(memberRow, { onConflict: "school_id,user_id" })
    .select("*")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível adicionar o membro.");
  }

  return data;
}

/**
 * Resolves the gestor's primary school, creating one when a site admin or
 * school_manager has no membership and no school exists yet (first gestor access).
 */
export async function ensurePrimarySchoolIdForUser(
  userId: string,
): Promise<string | null> {
  const existing = await getPrimarySchoolIdForUser(userId);
  if (existing) return existing;

  const canBootstrap =
    (await isSiteAdminUser(userId)) || (await isSchoolManagerProfile(userId));
  if (!canBootstrap) return null;

  const supabase = getSupabaseAdminClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("school_name")
    .eq("id", userId)
    .maybeSingle();

  const schoolName =
    String(
      (profile as { school_name?: string | null } | null)?.school_name || "",
    ).trim() || "Minha Escola";

  const school = await createSchool(userId, { name: schoolName });
  return String((school as { id: string }).id);
}

export async function getUserSchoolContext(userId: string): Promise<SchoolContext> {
  const supabase = getSupabaseAdminClient();
  const schoolId = await getPrimarySchoolIdForUser(userId);

  if (!schoolId) {
    return { school: null, membership: null, classes: [] };
  }

  const [{ data: school }, { data: membership }, classes] = await Promise.all([
    supabase.from("schools").select("*").eq("id", schoolId).maybeSingle(),
    supabase
      .from("school_memberships")
      .select("*")
      .eq("school_id", schoolId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    listSchoolClasses(schoolId),
  ]);

  return {
    school: (school as SchoolContext["school"]) || null,
    membership: (membership as SchoolContext["membership"]) || null,
    classes: classes as SchoolContext["classes"],
  };
}

export async function listSchoolGeneratedMaterials(
  schoolId: string,
  filters: GeneratedMaterialListFilters = {},
) {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(filters.limit ?? 50, 1), 200);
  const offset = Math.max(filters.offset ?? 0, 0);

  let query = supabase
    .from("generated_materials")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filters.surface) {
    query = query.eq("surface", filters.surface);
  }

  if (filters.tipo) {
    query = query.eq("tipo", filters.tipo);
  }

  if (filters.classId) {
    query = query.eq("class_id", filters.classId);
  }

  if (filters.userId) {
    query = query.eq("user_id", filters.userId);
  }

  if (filters.discipline) {
    query = query.ilike("discipline", `%${filters.discipline.trim()}%`);
  }

  if (filters.fromDate) {
    query = query.gte("created_at", filters.fromDate);
  }

  if (filters.toDate) {
    query = query.lte("created_at", filters.toDate);
  }

  if (filters.bnccCode) {
    query = query.contains("bncc_skill_codes", [filters.bnccCode.toUpperCase()]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function listSchoolMaterialsAudit(
  schoolId: string,
  filters: GeneratedMaterialListFilters = {},
): Promise<SchoolMaterialsResponse> {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
  const offset = Math.max(filters.offset ?? 0, 0);

  let listQuery = supabase
    .from("generated_materials")
    .select("*")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  let countQuery = supabase
    .from("generated_materials")
    .select("*", { count: "exact", head: true })
    .eq("school_id", schoolId);

  if (filters.surface) {
    listQuery = listQuery.eq("surface", filters.surface);
    countQuery = countQuery.eq("surface", filters.surface);
  }
  if (filters.tipo) {
    listQuery = listQuery.eq("tipo", filters.tipo);
    countQuery = countQuery.eq("tipo", filters.tipo);
  }
  if (filters.classId) {
    listQuery = listQuery.eq("class_id", filters.classId);
    countQuery = countQuery.eq("class_id", filters.classId);
  }
  if (filters.userId) {
    listQuery = listQuery.eq("user_id", filters.userId);
    countQuery = countQuery.eq("user_id", filters.userId);
  }
  if (filters.discipline) {
    const pattern = `%${filters.discipline.trim()}%`;
    listQuery = listQuery.ilike("discipline", pattern);
    countQuery = countQuery.ilike("discipline", pattern);
  }
  if (filters.fromDate) {
    listQuery = listQuery.gte("created_at", filters.fromDate);
    countQuery = countQuery.gte("created_at", filters.fromDate);
  }
  if (filters.toDate) {
    listQuery = listQuery.lte("created_at", filters.toDate);
    countQuery = countQuery.lte("created_at", filters.toDate);
  }
  if (filters.bnccCode) {
    const codes = [filters.bnccCode.toUpperCase()];
    listQuery = listQuery.contains("bncc_skill_codes", codes);
    countQuery = countQuery.contains("bncc_skill_codes", codes);
  }

  const [{ data: school }, { data: rows, error }, { count, error: countError }, members, classes] =
    await Promise.all([
      supabase.from("schools").select("id,name").eq("id", schoolId).maybeSingle(),
      listQuery,
      countQuery,
      listSchoolMembers(schoolId),
      listSchoolClasses(schoolId),
    ]);

  if (error) {
    throw new Error(error.message);
  }

  if (countError) {
    throw new Error(countError.message);
  }

  if (!school) {
    throw new Error("Escola não encontrada.");
  }

  type MemberRow = {
    user_id: string;
    role: string;
    status: string;
    profile?: { email?: string | null; fullName?: string | null } | null;
  };

  const professors = (members as MemberRow[])
    .filter((row) => row.role === "teacher" && row.status === "active")
    .map((row) => {
      const email = row.profile?.email ? String(row.profile.email) : null;
      const fullName = row.profile?.fullName ? String(row.profile.fullName) : null;
      return {
        userId: String(row.user_id),
        name: fullName || email || "Professor",
        email,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const classNameById = new Map(
    (classes || []).map((row) => [
      String((row as { id: string }).id),
      String((row as { name: string }).name),
    ]),
  );

  const professorById = new Map(professors.map((row) => [row.userId, row]));
  const disciplineSet = new Set<string>();

  for (const cls of classes || []) {
    const discipline = String((cls as { discipline?: string | null }).discipline || "").trim();
    if (discipline) disciplineSet.add(discipline);
  }

  const materials: SchoolMaterialAuditRow[] = (rows || []).map((row: Record<string, unknown>) => {
    const material = row as {
      id: string;
      user_id: string;
      title: string;
      tipo: string;
      class_id: string | null;
      class_name: string | null;
      discipline: string | null;
      bncc_skill_codes: string[] | null;
      created_at: string;
    };

    const professor = professorById.get(String(material.user_id));
    const storedDiscipline = String(material.discipline || "").trim();
    if (storedDiscipline) disciplineSet.add(storedDiscipline);

    const classId = material.class_id ? String(material.class_id) : null;
    const className =
      (classId ? classNameById.get(classId) : null) ||
      (material.class_name ? String(material.class_name).trim() : null);

    return {
      id: String(material.id),
      professorName: professor?.name || null,
      professorEmail: professor?.email || null,
      title: String(material.title || "Sem título"),
      tipo: String(material.tipo || "—"),
      className,
      discipline: storedDiscipline || null,
      bnccSkillCodes: (material.bncc_skill_codes || []).map((code) => String(code)),
      createdAt: String(material.created_at),
    };
  });

  return {
    schoolId,
    schoolName: String((school as { name: string }).name),
    materials,
    total: count || 0,
    professors,
    disciplines: Array.from(disciplineSet).sort((a, b) => a.localeCompare(b, "pt-BR")),
  };
}
