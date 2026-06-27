import { NextRequest, NextResponse } from "next/server";
import { requireOwnerApi } from "@/server/auth/owner-access";
import { fetchCorpusCandidateStats } from "@/server/corpus/corpus-candidates-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireOwnerApi(request);
  if (!gate.ok) return gate.response;

  const stats = await fetchCorpusCandidateStats();

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
