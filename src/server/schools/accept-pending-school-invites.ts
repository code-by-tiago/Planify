import type { TablesUpdate } from "@/types/database";
import { getSupabaseAdminClient } from "../supabase/admin-client";
import { createSchoolMember } from "./school-service";
import { grantSchoolProPlan } from "./school-pro-grant";

export type AcceptPendingSchoolInvitesResult = {
  acceptedCount: number;
  schoolIds: string[];
  proGranted: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Vincula convites pendentes ao usuário autenticado (login ou cadastro).
 * Cria membership na escola, marca convite como aceito e concede Pro quando aplicável.
 */
export async function acceptPendingSchoolInvites(
  userId: string,
  email: string,
): Promise<AcceptPendingSchoolInvitesResult> {
  const normalized = normalizeEmail(email);

  if (!normalized || !normalized.includes("@")) {
    return { acceptedCount: 0, schoolIds: [], proGranted: false };
  }

  const supabase = getSupabaseAdminClient();
  const { data: invites, error } = await supabase
    .from("school_invites")
    .select("id,school_id")
    .eq("status", "pending")
    .ilike("email", normalized);

  if (error) {
    throw new Error(error.message || "Não foi possível consultar convites pendentes.");
  }

  const rows = (invites || []) as Array<{ id: string; school_id: string }>;

  if (rows.length === 0) {
    const { count, error: membershipError } = await supabase
      .from("school_memberships")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active");

    if (membershipError) {
      throw new Error(
        membershipError.message || "Não foi possível consultar vínculo escolar.",
      );
    }

    if (!count) {
      return { acceptedCount: 0, schoolIds: [], proGranted: false };
    }

    const proGranted = await grantSchoolProPlan(userId);
    return { acceptedCount: 0, schoolIds: [], proGranted };
  }

  const schoolIds: string[] = [];

  for (const invite of rows) {
    await createSchoolMember(invite.school_id, {
      userId,
      role: "teacher",
      status: "active",
    });

    const inviteUpdate: TablesUpdate<"school_invites"> = {
      status: "accepted",
      accepted_user_id: userId,
    };

    const { error: updateError } = await supabase
      .from("school_invites")
      .update(inviteUpdate)
      .eq("id", invite.id);

    if (updateError) {
      throw new Error(updateError.message || "Não foi possível aceitar o convite.");
    }

    schoolIds.push(invite.school_id);
  }

  const proGranted = await grantSchoolProPlan(userId);

  return {
    acceptedCount: rows.length,
    schoolIds,
    proGranted,
  };
}
