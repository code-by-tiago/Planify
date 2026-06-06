import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { SchoolMembershipRole } from "@/types/school";
import { getPrimarySchoolIdForUser } from "../schools/school-access";

export type UserAccessProfile = {
  profileRole: string;
  schoolId: string | null;
  schoolMembershipRole: SchoolMembershipRole | null;
};

export async function resolveUserAccessProfile(
  userId: string,
): Promise<UserAccessProfile> {
  const supabase = getSupabaseAdminClient();

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase
      .from("school_memberships")
      .select("school_id,role,status,created_at")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: true }),
  ]);

  const profileRole = String(
    (profile as { role?: string | null } | null)?.role || "teacher",
  );

  const rows = (memberships || []) as Array<{
    school_id: string;
    role: SchoolMembershipRole;
  }>;

  if (rows.length === 0) {
    const schoolId =
      profileRole === "school_manager"
        ? await getPrimarySchoolIdForUser(userId)
        : null;

    return {
      profileRole,
      schoolId,
      schoolMembershipRole: null,
    };
  }

  const director = rows.find((row) => row.role === "director");
  const primary = director || rows[0];

  return {
    profileRole,
    schoolId: primary.school_id,
    schoolMembershipRole: primary.role,
  };
}
