import type { TablesInsert } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { createSchoolMember } from "./school-service";

export type SchoolInviteResult = {
  status: "accepted" | "pending";
  message: string;
  userId?: string;
  inviteId?: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalizeEmail(email))
    .maybeSingle();

  return (data as { id?: string } | null)?.id || null;
}

export async function inviteTeacherToSchool(
  schoolId: string,
  email: string,
  invitedBy: string,
): Promise<SchoolInviteResult> {
  const normalized = normalizeEmail(email);

  if (!normalized || !normalized.includes("@")) {
    throw new Error("Informe um e-mail válido.");
  }

  const existingUserId = await findUserIdByEmail(normalized);

  if (existingUserId) {
    await createSchoolMember(schoolId, {
      userId: existingUserId,
      role: "teacher",
      status: "active",
    });

    const supabase = getSupabaseAdminClient();
    const inviteRow: TablesInsert<"school_invites"> = {
      school_id: schoolId,
      email: normalized,
      status: "accepted",
      invited_by: invitedBy,
      accepted_user_id: existingUserId,
    };

    await supabase
      .from("school_invites")
      .upsert(inviteRow, { onConflict: "school_id,email" });

    return {
      status: "accepted",
      message: "Professor vinculado à escola. Acesso escolar ativo via associação.",
      userId: existingUserId,
    };
  }

  const supabase = getSupabaseAdminClient();
  const pendingRow: TablesInsert<"school_invites"> = {
    school_id: schoolId,
    email: normalized,
    status: "pending",
    invited_by: invitedBy,
  };

  const { data, error } = await supabase
    .from("school_invites")
    .upsert(pendingRow, { onConflict: "school_id,email" })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message || "Não foi possível registrar o convite.");
  }

  return {
    status: "pending",
    message:
      "Convite pendente. O professor será vinculado automaticamente ao criar conta com este e-mail.",
    inviteId: (data as { id?: string } | null)?.id,
  };
}
