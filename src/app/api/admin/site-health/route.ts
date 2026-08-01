import { NextRequest, NextResponse } from "next/server";
import { fetchSiteHealthReport } from "../../../../server/admin/site-health-service";
import { requireOwnerApi } from "../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const health = fetchSiteHealthReport();

  return NextResponse.json(
    {
      success: true,
      health,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
