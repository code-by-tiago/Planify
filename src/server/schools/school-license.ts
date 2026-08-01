import type { TablesUpdate } from "@/types/database";
import {
  getTeacherLimitForPlan,
  INSTITUTIONAL_PLAN_LABELS,
  parseInstitutionalPlanFromMetadata,
  type InstitutionalPlanKey,
} from "@/lib/school/institutional-plan";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { listSchoolPendingInvites } from "./school-invite-service";

export type SchoolLicenseInfo = {
  institutionalPlan: InstitutionalPlanKey | null;
  planLabel: string | null;
  teacherLimit: number | null;
  activeTeachers: number;
  pendingInvites: number;
  seatsUsed: number;
  seatsAvailable: number | null;
};

export async function getSchoolLicenseInfo(
  schoolId: string,
): Promise<SchoolLicenseInfo> {
  const supabase = getSupabaseAdminClient();

  const [{ data: school }, { count: activeCount }, pendingInvites] =
    await Promise.all([
      supabase.from("schools").select("metadata").eq("id", schoolId).maybeSingle(),
      supabase
        .from("school_memberships")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .eq("role", "teacher")
        .eq("status", "active"),
      listSchoolPendingInvites(schoolId),
    ]);

  const institutionalPlan = parseInstitutionalPlanFromMetadata(
    (school as { metadata?: unknown } | null)?.metadata,
  );
  const teacherLimit = getTeacherLimitForPlan(institutionalPlan);
  const activeTeachers = activeCount || 0;
  const pendingCount = pendingInvites.length;
  const seatsUsed = activeTeachers + pendingCount;

  return {
    institutionalPlan,
    planLabel: institutionalPlan
      ? INSTITUTIONAL_PLAN_LABELS[institutionalPlan]
      : null,
    teacherLimit,
    activeTeachers,
    pendingInvites: pendingCount,
    seatsUsed,
    seatsAvailable:
      teacherLimit !== null ? Math.max(teacherLimit - seatsUsed, 0) : null,
  };
}

export async function assertCanInviteTeacher(schoolId: string): Promise<void> {
  const license = await getSchoolLicenseInfo(schoolId);

  if (license.teacherLimit === null) return;

  if (license.seatsUsed >= license.teacherLimit) {
    const planHint = license.planLabel ? ` (${license.planLabel})` : "";
    throw new Error(
      `Limite de ${license.teacherLimit} professores atingido${planHint}. Remova um vínculo ou atualize o plano institucional.`,
    );
  }
}

export async function revokeSchoolTeacher(
  schoolId: string,
  teacherUserId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: membership, error: lookupError } = await supabase
    .from("school_memberships")
    .select("id,role")
    .eq("school_id", schoolId)
    .eq("user_id", teacherUserId)
    .eq("role", "teacher")
    .eq("status", "active")
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  if (!membership) {
    throw new Error("Professor não encontrado ou já desvinculado.");
  }

  const update: TablesUpdate<"school_memberships"> = { status: "inactive" };

  const { error } = await supabase
    .from("school_memberships")
    .update(update)
    .eq("id", (membership as { id: string }).id);

  if (error) {
    throw new Error(error.message || "Não foi possível revogar a licença.");
  }
}

export async function revokeSchoolInvite(
  schoolId: string,
  inviteId: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();

  const { data: invite, error: lookupError } = await supabase
    .from("school_invites")
    .select("id,status")
    .eq("id", inviteId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const row = invite as { id?: string; status?: string } | null;

  if (!row?.id) {
    throw new Error("Convite não encontrado.");
  }

  if (row.status !== "pending") {
    throw new Error("Apenas convites pendentes podem ser cancelados.");
  }

  const update: TablesUpdate<"school_invites"> = { status: "revoked" };

  const { error } = await supabase
    .from("school_invites")
    .update(update)
    .eq("id", inviteId)
    .eq("school_id", schoolId);

  if (error) {
    throw new Error(error.message || "Não foi possível cancelar o convite.");
  }
}
