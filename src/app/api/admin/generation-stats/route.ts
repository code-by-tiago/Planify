import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "../../../../server/auth/admin-access";
import {
  fetchGenerationStats,
  type GenerationStatsWindow,
} from "../../../../server/telemetry/generation-stats-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseWindow(value: string | null): GenerationStatsWindow {
  return value === "7d" ? "7d" : "24h";
}

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi(request);
  if (!admin.ok) return admin.response;

  const window = parseWindow(request.nextUrl.searchParams.get("window"));
  const stats = await fetchGenerationStats(window);

  return NextResponse.json(
    {
      success: true,
      stats,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
