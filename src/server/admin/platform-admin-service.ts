import type { CreateSchoolInput } from "@/types/school";
import type { Json, TablesInsert } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export type AdminSchoolRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  memberCount: number;
  classCount: number;
  createdAt: string;
};

export type AdminUserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  planKey: string | null;
  schoolName: string | null;
  createdAt: string;
};

export type AdminMaterialRow = {
  id: string;
  title: string;
  tipo: string;
  userId: string;
  userEmail: string | null;
  schoolId: string | null;
  schoolName: string | null;
  className: string | null;
  bnccCount: number;
  createdAt: string;
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function listAdminSchools(): Promise<AdminSchoolRow[]> {
  const supabase = getSupabaseAdminClient();

  const { data: schools, error } = await supabase
    .from("schools")
    .select("id,name,city,state,created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (schools || []) as Array<{
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    created_at: string;
  }>;

  if (rows.length === 0) {
    return [];
  }

  const schoolIds = rows.map((row) => row.id);

  const [{ data: memberships }, { data: classes }] = await Promise.all([
    supabase
      .from("school_memberships")
      .select("school_id")
      .in("school_id", schoolIds)
      .eq("status", "active"),
    supabase.from("school_classes").select("school_id").in("school_id", schoolIds),
  ]);

  const memberCountBySchool = new Map<string, number>();
  for (const row of memberships || []) {
    const schoolId = String((row as { school_id: string }).school_id);
    memberCountBySchool.set(schoolId, (memberCountBySchool.get(schoolId) || 0) + 1);
  }

  const classCountBySchool = new Map<string, number>();
  for (const row of classes || []) {
    const schoolId = String((row as { school_id: string }).school_id);
    classCountBySchool.set(schoolId, (classCountBySchool.get(schoolId) || 0) + 1);
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    memberCount: memberCountBySchool.get(row.id) || 0,
    classCount: classCountBySchool.get(row.id) || 0,
    createdAt: row.created_at,
  }));
}

export async function createAdminSchool(
  input: CreateSchoolInput,
): Promise<{ id: string; name: string }> {
  const supabase = getSupabaseAdminClient();
  const name = String(input.name || "").trim();

  if (!name) {
    throw new Error("Informe o nome da escola.");
  }

  const schoolRow: TablesInsert<"schools"> = {
    name,
    slug: input.slug?.trim() || slugify(name) || null,
    city: input.city?.trim() || null,
    state: input.state?.trim() || null,
    metadata: (input.metadata || {}) as Json,
    director_user_id: null,
  };

  const { data, error } = await supabase
    .from("schools")
    .insert(schoolRow)
    .select("id,name")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Não foi possível criar a escola.");
  }

  return data as { id: string; name: string };
}

export async function listAdminUsers(filters: {
  q?: string;
  limit?: number;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(filters.limit || 50, 1), 200);
  const queryText = String(filters.q || "").trim().toLowerCase();

  let query = supabase
    .from("profiles")
    .select("id,email,full_name,role,status,school_name,created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (queryText) {
    query = query.or(
      `email.ilike.%${queryText}%,full_name.ilike.%${queryText}%,school_name.ilike.%${queryText}%`,
    );
  }

  const { data: profiles, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const userIds = (profiles || []).map((row) => (row as { id: string }).id);

  const { data: subs } = userIds.length
    ? await supabase
        .from("subscriptions")
        .select("user_id,plan_key,status")
        .in("user_id", userIds)
        .in("status", ["active", "trialing"])
    : { data: [] };

  const planByUser = new Map<string, string>();
  for (const sub of subs || []) {
    const userId = String((sub as { user_id?: string }).user_id || "");
    const planKey = String((sub as { plan_key?: string }).plan_key || "");
    if (userId && planKey) {
      planByUser.set(userId, planKey);
    }
  }

  const users = (profiles || []).map(
    (row: {
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      status: string;
      school_name: string | null;
      created_at: string;
    }) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      status: row.status,
      planKey: planByUser.get(row.id) || null,
      schoolName: row.school_name,
      createdAt: row.created_at,
    }),
  );

  return { users, total: count || users.length };
}

export async function listAdminGeneratedMaterials(filters: {
  q?: string;
  limit?: number;
}): Promise<{ materials: AdminMaterialRow[]; total: number }> {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(filters.limit || 50, 1), 200);
  const queryText = String(filters.q || "").trim().toLowerCase();

  let query = supabase
    .from("generated_materials")
    .select(
      "id,title,tipo,user_id,school_id,class_name,bncc_skill_codes,created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (queryText) {
    query = query.or(`title.ilike.%${queryText}%,tipo.ilike.%${queryText}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as Array<{
    id: string;
    title: string;
    tipo: string;
    user_id: string;
    school_id: string | null;
    class_name: string | null;
    bncc_skill_codes: string[] | null;
    created_at: string;
  }>;

  const userIds = Array.from(new Set(rows.map((row) => row.user_id)));
  const schoolIds = Array.from(
    new Set(rows.map((row) => row.school_id).filter(Boolean)),
  ) as string[];

  const [{ data: profiles }, { data: schools }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id,email").in("id", userIds)
      : Promise.resolve({ data: [] }),
    schoolIds.length
      ? supabase.from("schools").select("id,name").in("id", schoolIds)
      : Promise.resolve({ data: [] }),
  ]);

  const emailByUser = new Map<string, string>();
  for (const row of profiles || []) {
    emailByUser.set(
      (row as { id: string }).id,
      String((row as { email?: string }).email || ""),
    );
  }

  const schoolNameById = new Map<string, string>();
  for (const row of schools || []) {
    schoolNameById.set(
      (row as { id: string }).id,
      String((row as { name?: string }).name || ""),
    );
  }

  const materials = rows.map((row) => ({
    id: row.id,
    title: row.title,
    tipo: row.tipo,
    userId: row.user_id,
    userEmail: emailByUser.get(row.user_id) || null,
    schoolId: row.school_id,
    schoolName: row.school_id ? schoolNameById.get(row.school_id) || null : null,
    className: row.class_name,
    bnccCount: (row.bncc_skill_codes || []).length,
    createdAt: row.created_at,
  }));

  return { materials, total: count || materials.length };
}

export async function deleteAdminGeneratedMaterial(
  materialId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("generated_materials")
    .delete()
    .eq("id", materialId);

  if (error) {
    throw new Error(error.message);
  }
}
