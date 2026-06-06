import { NextRequest, NextResponse } from "next/server";
import { fetchAdminOverview } from "../../../../server/admin/overview-service";
import { requireOwnerApi } from "../../../../server/auth/owner-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const overview = await fetchAdminOverview();

  return NextResponse.json(
    {
      success: true,
      overview,
      ownerEmail: gate.owner.email,
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
