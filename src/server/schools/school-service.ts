import type { Json, TablesInsert } from "@/types/database";
import type {
  CreateSchoolClassInput,
  CreateSchoolInput,
  CreateSchoolMemberInput,
  SchoolContext,
} from "@/types/school";
import type { GeneratedMaterialListFilters } from "@/types/generated-material";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { getPrimarySchoolIdForUser } from "./school-access";

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

  let profilesById = new Map<string, Record<string, unknown>>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,email,full_name,school_name")
      .in("id", userIds);

    profilesById = new Map(
      (profiles || []).map((profile) => [
        String((profile as { id: string }).id),
        profile as Record<string, unknown>,
      ]),
    );
  }

  return rows.map((row) => {
    const userId = String((row as { user_id: string }).user_id);
    const profile = profilesById.get(userId);

    return {
      ...(row as Record<string, unknown>),
      profile: profile
        ? {
            email: profile.email,
            fullName: profile.full_name,
            schoolName: profile.school_name,
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

  if (filters.bnccCode) {
    query = query.contains("bncc_skill_codes", [filters.bnccCode.toUpperCase()]);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}
