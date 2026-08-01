import { getSupabaseAdminClient } from "../supabase/admin-client";
import { isOwnerEmail } from "../auth/owner-emails";
import type { SchoolMembershipRole } from "@/types/school";

type MembershipRow = {
  id: string;
  school_id: string;
  user_id: string;
  role: SchoolMembershipRole;
  status: string;
};

export async function getUserMembershipForSchool(
  userId: string,
  schoolId: string,
): Promise<MembershipRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("school_memberships")
    .select("id,school_id,user_id,role,status")
    .eq("user_id", userId)
    .eq("school_id", schoolId)
    .eq("status", "active")
    .maybeSingle();

  if (error || !data) return null;
  return data as MembershipRow;
}

export async function isSchoolDirector(
  userId: string,
  schoolId: string,
): Promise<boolean> {
  const membership = await getUserMembershipForSchool(userId, schoolId);
  return membership?.role === "director";
}

export async function isSchoolManagerProfile(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return (data as { role?: string | null } | null)?.role === "school_manager";
}

export async function isSiteAdminUser(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("role,is_admin,email")
    .eq("id", userId)
    .maybeSingle();

  const profile = data as {
    role?: string | null;
    is_admin?: boolean | null;
    email?: string | null;
  } | null;

  const role = String(profile?.role || "").trim().toLowerCase();
  const email = String(profile?.email || "").trim().toLowerCase();

  return (
    Boolean(profile?.is_admin) ||
    role === "admin" ||
    role === "owner" ||
    isOwnerEmail(email)
  );
}

export async function canAccessSchoolDashboard(
  userId: string,
  schoolId: string,
): Promise<boolean> {
  if (await isSiteAdminUser(userId)) return false;
  if (await isSchoolManagerProfile(userId)) return true;
  return isSchoolDirector(userId, schoolId);
}

export async function requireSchoolDirector(
  userId: string,
  schoolId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const isDirector = await isSchoolDirector(userId, schoolId);

  if (!isDirector) {
    return {
      ok: false,
      message: "Acesso restrito a diretores da escola.",
    };
  }

  return { ok: true };
}

export async function requireSchoolDashboardAccess(
  userId: string,
  schoolId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const allowed = await canAccessSchoolDashboard(userId, schoolId);

  if (!allowed) {
    return {
      ok: false,
      message: "Acesso restrito a gestores e diretores da escola.",
    };
  }

  return { ok: true };
}

export async function getPrimarySchoolIdForUser(
  userId: string,
): Promise<string | null> {
  const supabase = getSupabaseAdminClient();

  const { data: memberships } = await supabase
    .from("school_memberships")
    .select("school_id,role,created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  const rows = (memberships || []) as Array<{
    school_id: string;
    role: SchoolMembershipRole;
  }>;

  if (rows.length === 0) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("school_name")
      .eq("id", userId)
      .maybeSingle();

    const schoolName = String(
      (profile as { school_name?: string | null } | null)?.school_name || "",
    ).trim();

    if (!schoolName) return null;

    const { data: school } = await supabase
      .from("schools")
      .select("id")
      .ilike("name", schoolName)
      .maybeSingle();

    return (school as { id?: string } | null)?.id || null;
  }

  const director = rows.find((row) => row.role === "director");
  return director?.school_id || rows[0]?.school_id || null;
}
