import { NextRequest, NextResponse } from "next/server";
import { fetchAdminDashboardMetrics } from "../../../../server/admin/platform-admin-metrics";
import { requireOwnerApi } from "../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  try {
    const metrics = await fetchAdminDashboardMetrics();

    return NextResponse.json(
      { success: true, metrics },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "metrics_failed",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar métricas.",
        },
      },
      { status: 500 },
    );
  }
}
