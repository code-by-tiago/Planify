import type { CreateSchoolInput } from "@/types/school";
import type { UserRole, UserStatus } from "@/types/user";
import type { Json, TablesInsert, TablesUpdate } from "@/types/database";
import {
  INSTITUTIONAL_PLAN_LABELS,
  parseInstitutionalPlanFromMetadata,
  type InstitutionalPlanKey,
} from "@/lib/school/institutional-plan";
import { getSupabaseAdminClient } from "../supabase/admin-client";

export type AdminSchoolRow = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  memberCount: number;
  classCount: number;
  institutionalPlan: InstitutionalPlanKey | null;
  planLabel: string | null;
  directorUserId: string | null;
  directorEmail: string | null;
  directorName: string | null;
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

const ASSIGNABLE_USER_ROLES = new Set<UserRole>([
  "teacher",
  "school_manager",
  "admin",
]);

const ASSIGNABLE_USER_STATUSES = new Set<UserStatus>([
  "active",
  "inactive",
  "pending",
  "blocked",
]);

export type CreateAdminUserInput = {
  email: string;
  password?: string;
  fullName?: string;
  role?: UserRole;
  schoolId?: string;
  mode?: "password" | "invite";
};

export type UpdateAdminUserInput = {
  role?: UserRole;
  status?: UserStatus;
  fullName?: string | null;
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

function normalizeEmail(value: string): string {
  return String(value || "").trim().toLowerCase();
}

async function findProfileByEmail(email: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,status,is_owner")
    .ilike("email", normalizeEmail(email))
    .maybeSingle();

  return data as {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    status: string;
    is_owner: boolean;
  } | null;
}

async function assertNotOwnerProfile(userId: string) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("role,is_owner")
    .eq("id", userId)
    .maybeSingle();

  const profile = data as { role?: string; is_owner?: boolean } | null;

  if (profile?.is_owner || profile?.role === "owner") {
    throw new Error("Contas de proprietário não podem ser alteradas por aqui.");
  }
}

async function mapAdminUserRow(userId: string): Promise<AdminUserRow> {
  const supabase = getSupabaseAdminClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,full_name,role,status,school_name,created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) {
    throw new Error(error?.message || "Perfil não encontrado.");
  }

  const row = profile as {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    status: string;
    school_name: string | null;
    created_at: string;
  };

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("plan_key")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .limit(1);

  const planKey = String(
    (subs?.[0] as { plan_key?: string } | undefined)?.plan_key || "",
  );

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    planKey: planKey || null,
    schoolName: row.school_name,
    createdAt: row.created_at,
  };
}

export async function listAdminSchools(): Promise<AdminSchoolRow[]> {
  const supabase = getSupabaseAdminClient();

  const { data: schools, error } = await supabase
    .from("schools")
    .select("id,name,city,state,metadata,director_user_id,created_at")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (schools || []) as Array<{
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    metadata: unknown;
    director_user_id: string | null;
    created_at: string;
  }>;

  if (rows.length === 0) {
    return [];
  }

  const schoolIds = rows.map((row) => row.id);
  const directorIds = Array.from(
    new Set(rows.map((row) => row.director_user_id).filter(Boolean)),
  ) as string[];

  const [{ data: memberships }, { data: classes }, { data: directors }] =
    await Promise.all([
    supabase
      .from("school_memberships")
      .select("school_id")
      .in("school_id", schoolIds)
      .eq("status", "active"),
    supabase.from("school_classes").select("school_id").in("school_id", schoolIds),
    directorIds.length
      ? supabase
          .from("profiles")
          .select("id,email,full_name")
          .in("id", directorIds)
      : Promise.resolve({ data: [] }),
  ]);

  const directorById = new Map<
    string,
    { email: string; fullName: string | null }
  >();
  for (const row of directors || []) {
    directorById.set((row as { id: string }).id, {
      email: String((row as { email?: string }).email || ""),
      fullName: (row as { full_name?: string | null }).full_name || null,
    });
  }

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

  return rows.map((row) => {
    const institutionalPlan = parseInstitutionalPlanFromMetadata(row.metadata);
    const director = row.director_user_id
      ? directorById.get(row.director_user_id)
      : null;

    return {
      id: row.id,
      name: row.name,
      city: row.city,
      state: row.state,
      memberCount: memberCountBySchool.get(row.id) || 0,
      classCount: classCountBySchool.get(row.id) || 0,
      institutionalPlan,
      planLabel: institutionalPlan
        ? INSTITUTIONAL_PLAN_LABELS[institutionalPlan]
        : null,
      directorUserId: row.director_user_id,
      directorEmail: director?.email || null,
      directorName: director?.fullName || null,
      createdAt: row.created_at,
    };
  });
}

export async function updateAdminSchoolLicense(
  schoolId: string,
  institutionalPlan: InstitutionalPlanKey | null,
): Promise<{ id: string; institutionalPlan: InstitutionalPlanKey | null }> {
  const supabase = getSupabaseAdminClient();
  const id = String(schoolId || "").trim();

  if (!id) {
    throw new Error("Informe o id da escola.");
  }

  const { data: school, error: lookupError } = await supabase
    .from("schools")
    .select("id,metadata")
    .eq("id", id)
    .maybeSingle();

  if (lookupError || !school) {
    throw new Error(lookupError?.message || "Escola não encontrada.");
  }

  const metadata = {
    ...((school as { metadata?: Record<string, unknown> }).metadata || {}),
  };

  if (institutionalPlan) {
    metadata.institutionalPlan = institutionalPlan;
  } else {
    delete metadata.institutionalPlan;
  }

  const { error } = await supabase
    .from("schools")
    .update({ metadata: metadata as Json })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return { id, institutionalPlan };
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

export async function createAdminUser(
  input: CreateAdminUserInput,
): Promise<AdminUserRow> {
  const supabase = getSupabaseAdminClient();
  const email = normalizeEmail(input.email);
  const fullName = String(input.fullName || "").trim();
  const role = (input.role || "teacher") as UserRole;
  const mode = input.mode || (input.password ? "password" : "invite");
  const schoolId = String(input.schoolId || "").trim();

  if (!email || !email.includes("@")) {
    throw new Error("Informe um e-mail válido.");
  }

  if (!ASSIGNABLE_USER_ROLES.has(role)) {
    throw new Error("Papel inválido para criação de usuário.");
  }

  const existing = await findProfileByEmail(email);
  if (existing) {
    throw new Error("Já existe um usuário com este e-mail.");
  }

  let userId = "";

  if (mode === "invite") {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
    });

    if (error || !data.user) {
      throw new Error(error?.message || "Não foi possível enviar o convite.");
    }

    userId = data.user.id;
  } else {
    const password = String(input.password || "");
    if (password.length < 8) {
      throw new Error("A senha deve ter pelo menos 8 caracteres.");
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      throw new Error(error?.message || "Não foi possível criar o usuário.");
    }

    userId = data.user.id;
  }

  const profileUpdate: TablesUpdate<"profiles"> = {
    email,
    full_name: fullName || null,
    role,
    status: mode === "invite" ? "pending" : "active",
    is_admin: role === "admin",
    updated_at: new Date().toISOString(),
  };

  const { data: updatedProfile, error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!updatedProfile) {
    const profileRow: TablesInsert<"profiles"> = {
      id: userId,
      email,
      full_name: fullName || null,
      role,
      status: mode === "invite" ? "pending" : "active",
      is_admin: role === "admin",
    };

    const { error: insertError } = await supabase.from("profiles").insert(profileRow);

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  if (schoolId) {
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id,name")
      .eq("id", schoolId)
      .maybeSingle();

    if (schoolError || !school) {
      throw new Error(schoolError?.message || "Escola não encontrada.");
    }

    const membershipRole =
      role === "school_manager" ? ("director" as const) : ("teacher" as const);

    const memberRow: TablesInsert<"school_memberships"> = {
      school_id: schoolId,
      user_id: userId,
      role: membershipRole,
      status: "active",
    };

    const { error: membershipError } = await supabase
      .from("school_memberships")
      .upsert(memberRow, { onConflict: "school_id,user_id" });

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (membershipRole === "director") {
      await supabase
        .from("schools")
        .update({
          director_user_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", schoolId);
    }

    await supabase
      .from("profiles")
      .update({
        school_name: (school as { name: string }).name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
  }

  return mapAdminUserRow(userId);
}

export async function updateAdminUser(
  userId: string,
  input: UpdateAdminUserInput,
): Promise<AdminUserRow> {
  const supabase = getSupabaseAdminClient();
  const id = String(userId || "").trim();

  if (!id) {
    throw new Error("Informe o id do usuário.");
  }

  await assertNotOwnerProfile(id);

  const profileUpdate: TablesUpdate<"profiles"> = {
    updated_at: new Date().toISOString(),
  };

  if (input.fullName !== undefined) {
    profileUpdate.full_name = String(input.fullName || "").trim() || null;
  }

  if (input.role !== undefined) {
    if (!ASSIGNABLE_USER_ROLES.has(input.role)) {
      throw new Error("Papel inválido.");
    }
    profileUpdate.role = input.role;
    profileUpdate.is_admin = input.role === "admin";
  }

  if (input.status !== undefined) {
    if (!ASSIGNABLE_USER_STATUSES.has(input.status)) {
      throw new Error("Status inválido.");
    }
    profileUpdate.status = input.status;

    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      ban_duration: input.status === "blocked" ? "876000h" : "none",
    });

    if (authError) {
      throw new Error(authError.message);
    }
  }

  if (Object.keys(profileUpdate).length === 1) {
    throw new Error("Nenhuma alteração informada.");
  }

  const { error } = await supabase.from("profiles").update(profileUpdate).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return mapAdminUserRow(id);
}

export async function updateAdminSchoolDirector(
  schoolId: string,
  directorEmail: string | null,
): Promise<{
  id: string;
  directorUserId: string | null;
  directorEmail: string | null;
  directorName: string | null;
}> {
  const supabase = getSupabaseAdminClient();
  const id = String(schoolId || "").trim();

  if (!id) {
    throw new Error("Informe o id da escola.");
  }

  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .select("id,name,director_user_id")
    .eq("id", id)
    .maybeSingle();

  if (schoolError || !school) {
    throw new Error(schoolError?.message || "Escola não encontrada.");
  }

  const normalizedEmail = directorEmail ? normalizeEmail(directorEmail) : "";

  if (!normalizedEmail) {
    const previousDirectorId = (school as { director_user_id?: string | null })
      .director_user_id;

    const { error } = await supabase
      .from("schools")
      .update({
        director_user_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    if (previousDirectorId) {
      await supabase
        .from("school_memberships")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("school_id", id)
        .eq("user_id", previousDirectorId)
        .eq("role", "director");
    }

    return {
      id,
      directorUserId: null,
      directorEmail: null,
      directorName: null,
    };
  }

  const profile = await findProfileByEmail(normalizedEmail);

  if (!profile) {
    throw new Error("Usuário não encontrado. Crie a conta antes de vincular.");
  }

  const previousDirectorId = (school as { director_user_id?: string | null })
    .director_user_id;

  if (previousDirectorId && previousDirectorId !== profile.id) {
    await supabase
      .from("school_memberships")
      .update({
        status: "inactive",
        updated_at: new Date().toISOString(),
      })
      .eq("school_id", id)
      .eq("user_id", previousDirectorId)
      .eq("role", "director");
  }

  const memberRow: TablesInsert<"school_memberships"> = {
    school_id: id,
    user_id: profile.id,
    role: "director",
    status: "active",
  };

  const { error: membershipError } = await supabase
    .from("school_memberships")
    .upsert(memberRow, { onConflict: "school_id,user_id" });

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const { error: schoolUpdateError } = await supabase
    .from("schools")
    .update({
      director_user_id: profile.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (schoolUpdateError) {
    throw new Error(schoolUpdateError.message);
  }

  await supabase
    .from("profiles")
    .update({
      school_name: (school as { name: string }).name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  return {
    id,
    directorUserId: profile.id,
    directorEmail: profile.email,
    directorName: profile.full_name,
  };
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

export {
  fetchAdminActivityFeed,
  fetchAdminDashboardMetrics,
  type AdminActivityFeedItem,
  type AdminDashboardMetrics,
  type AdminFinancialMetrics,
} from "./platform-admin-metrics";

export {
  areRegistrationsEnabled,
  fetchPlatformSettings,
  updatePlatformSettings,
  type PlatformSettings,
} from "./platform-settings-service";
