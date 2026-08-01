import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApi } from "@/server/auth/owner-access";
import {
  listCommunityReportsForAdmin,
  updateCommunityReportStatus,
  type CommunityReportStatus,
} from "@/server/community/community-reports-moderation-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const status = (request.nextUrl.searchParams.get("status") || "open") as
    | CommunityReportStatus
    | "all";

  try {
    const reports = await listCommunityReportsForAdmin({ status, limit: 100 });
    return NextResponse.json({ ok: true, reports });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível carregar denúncias.",
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const adminUserId = gate.owner.userId;
  if (!adminUserId) return jsonError("Conta admin não identificada.", 401);

  const body = await request.json().catch(() => ({}));
  const reportId = String(body.reportId || "").trim();
  const status = String(body.status || "").trim() as CommunityReportStatus;
  const adminNote = body.adminNote ? String(body.adminNote) : null;

  if (!reportId) return jsonError("Denúncia não informada.");
  if (status !== "resolved" && status !== "dismissed") {
    return jsonError("Status inválido. Use resolved ou dismissed.");
  }

  try {
    await updateCommunityReportStatus({
      reportId,
      adminUserId,
      status,
      adminNote,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível atualizar a denúncia.",
      500,
    );
  }
}
