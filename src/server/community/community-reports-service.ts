import { getSupabaseAdminClient } from "../supabase/admin-client";

export type CommunityReportTarget = "material" | "comment" | "user" | "group_message";

function isMissingTableError(message: string): boolean {
  return /schema cache|does not exist|relation.*not found/i.test(message);
}

export async function createCommunityReport(params: {
  reporterUserId: string;
  targetType: CommunityReportTarget;
  targetId: string;
  reason: string;
}): Promise<void> {
  const reason = params.reason.trim();

  if (reason.length < 3) {
    throw new Error("Descreva o motivo da denúncia (mín. 3 caracteres).");
  }

  const supabase = getSupabaseAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("community_reports").insert({
    reporter_user_id: params.reporterUserId,
    target_type: params.targetType,
    target_id: params.targetId,
    reason: reason.slice(0, 500),
  });

  if (error) {
    if (isMissingTableError(error.message)) {
      throw new Error("Denúncias em atualização no servidor. Tente novamente em instantes.");
    }
    throw new Error(error.message || "Não foi possível registrar a denúncia.");
  }
}
