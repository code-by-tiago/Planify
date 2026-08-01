import { NextRequest, NextResponse } from "next/server";
import { fetchAdminActivityFeed } from "../../../../server/admin/platform-admin-metrics";
import { requireOwnerApi } from "../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : 20;

  try {
    const items = await fetchAdminActivityFeed(
      Number.isFinite(limit) ? limit : 20,
    );

    return NextResponse.json(
      { success: true, items },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "activity_feed_failed",
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível carregar o feed de atividade.",
        },
      },
      { status: 500 },
    );
  }
}
