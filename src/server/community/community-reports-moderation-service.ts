import { getSupabaseAdminClient } from "../supabase/admin-client";
import type { CommunityReportTarget } from "./community-reports-service";

export type CommunityReportStatus = "open" | "resolved" | "dismissed";

export type CommunityReportQueueItem = {
  id: string;
  targetType: CommunityReportTarget;
  targetId: string;
  reason: string;
  status: CommunityReportStatus;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { id: string; email: string | null; name: string | null };
};

function isMissingColumnError(message: string): boolean {
  return /schema cache|does not exist|column.*not found/i.test(message);
}

export async function listCommunityReportsForAdmin(params?: {
  status?: CommunityReportStatus | "all";
  limit?: number;
}): Promise<CommunityReportQueueItem[]> {
  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(params?.limit || 50, 1), 200);
  const status = params?.status || "open";

  let query = (supabase as any)
    .from("community_reports")
    .select(
      "id,target_type,target_id,reason,status,admin_note,created_at,resolved_at,reporter_user_id",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingColumnError(error.message)) {
      const { data: legacyRows, error: legacyError } = await (supabase as any)
        .from("community_reports")
        .select("id,target_type,target_id,reason,created_at,reporter_user_id")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (legacyError) throw new Error(legacyError.message);

      const reporterIds = [
        ...new Set(
          (legacyRows || []).map((r: { reporter_user_id: string }) => r.reporter_user_id),
        ),
      ];
      const reporterMap = await resolveReporterProfiles(reporterIds as string[]);

      return (legacyRows || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        targetType: row.target_type as CommunityReportTarget,
        targetId: row.target_id as string,
        reason: row.reason as string,
        status: "open" as const,
        adminNote: null,
        createdAt: row.created_at as string,
        resolvedAt: null,
        reporter: reporterMap.get(row.reporter_user_id as string) || {
          id: row.reporter_user_id as string,
          email: null,
          name: null,
        },
      }));
    }
    throw new Error(error.message);
  }

  const reporterIds = [
    ...new Set((data || []).map((r: { reporter_user_id: string }) => r.reporter_user_id)),
  ];
  const reporterMap = await resolveReporterProfiles(reporterIds as string[]);

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    targetType: row.target_type as CommunityReportTarget,
    targetId: row.target_id as string,
    reason: row.reason as string,
    status: (row.status as CommunityReportStatus) || "open",
    adminNote: (row.admin_note as string | null) || null,
    createdAt: row.created_at as string,
    resolvedAt: (row.resolved_at as string | null) || null,
    reporter:
      reporterMap.get(row.reporter_user_id as string) || {
        id: row.reporter_user_id as string,
        email: null,
        name: null,
      },
  }));
}

async function resolveReporterProfiles(
  userIds: string[],
): Promise<Map<string, { id: string; email: string | null; name: string | null }>> {
  const map = new Map<string, { id: string; email: string | null; name: string | null }>();
  if (userIds.length === 0) return map;

  const supabase = getSupabaseAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,email,full_name")
    .in("id", userIds);

  for (const row of profiles || []) {
    map.set(row.id as string, {
      id: row.id as string,
      email: (row.email as string | null) || null,
      name: (row.full_name as string | null) || null,
    });
  }

  return map;
}

export async function updateCommunityReportStatus(params: {
  reportId: string;
  adminUserId: string;
  status: CommunityReportStatus;
  adminNote?: string | null;
}): Promise<void> {
  if (params.status === "open") {
    throw new Error("Use resolved ou dismissed para atualizar a denúncia.");
  }

  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = {
    status: params.status,
    resolved_at: new Date().toISOString(),
    resolved_by: params.adminUserId,
    admin_note: params.adminNote ? String(params.adminNote).slice(0, 500) : null,
  };

  const { error } = await (supabase as any)
    .from("community_reports")
    .update(payload)
    .eq("id", params.reportId);

  if (error) {
    if (isMissingColumnError(error.message)) {
      throw new Error("Moderação em atualização no servidor. Aplique a migration mais recente.");
    }
    throw new Error(error.message || "Não foi possível atualizar a denúncia.");
  }
}
