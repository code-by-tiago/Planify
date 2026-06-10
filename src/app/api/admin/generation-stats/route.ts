import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApi } from "../../../../server/auth/owner-access";
import {
  fetchGenerationStats,
  type GenerationStatsWindow,
} from "../../../../server/telemetry/generation-stats-service";
import { fetchOperationalStats } from "../../../../server/telemetry/operational-stats-service";
import { fetchPedagogicalUsageStats } from "@/server/pedagogical-cache/pedagogical-cache-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseWindow(value: string | null): GenerationStatsWindow {
  return value === "7d" ? "7d" : "24h";
}

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const window = parseWindow(request.nextUrl.searchParams.get("window"));
  const windowHours = window === "7d" ? 168 : 24;
  const [stats, operational, pedagogical] = await Promise.all([
    fetchGenerationStats(window),
    fetchOperationalStats(window),
    fetchPedagogicalUsageStats(windowHours),
  ]);

  return NextResponse.json(
    {
      success: true,
      stats,
      operational,
      pedagogical,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
