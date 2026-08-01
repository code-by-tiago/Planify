import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "@/server/auth/api-access";
import { getSchoolDashboardMetrics } from "@/server/bncc/bncc-progress-service";
import { requireSchoolDashboardAccess } from "@/server/schools/school-access";
import { ensurePrimarySchoolIdForUser } from "@/server/schools/school-service";
import { logOperationalEvent } from "@/server/telemetry/operational-telemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuthenticated(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Usuário não identificado." } },
      { status: 401 },
    );
  }

  const schoolId = await ensurePrimarySchoolIdForUser(userId);
  if (!schoolId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            "Nenhuma escola vinculada ao gestor. Peça ao suporte para associar sua conta.",
        },
      },
      { status: 400 },
    );
  }

  const access = await requireSchoolDashboardAccess(userId, schoolId);
  if (!access.ok) {
    return NextResponse.json(
      { success: false, error: { message: access.message } },
      { status: 403 },
    );
  }

  try {
    const dashboard = await getSchoolDashboardMetrics(schoolId);
    return NextResponse.json({ success: true, dashboard });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao carregar painel.";
    logOperationalEvent({
      eventType: "api_502",
      toolTipo: "school-dashboard",
      ok: false,
      errorCode: "exception",
      metadata: { message },
    });
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
