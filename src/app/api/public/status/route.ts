import { NextResponse } from "next/server";
import { fetchPublicStatusReport } from "@/server/public/public-status-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = fetchPublicStatusReport();

  return NextResponse.json(
    {
      success: true,
      status,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
