import { NextRequest, NextResponse } from "next/server";
import { markStaleEntries } from "@/server/pedagogical-cache/pedagogical-cache-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handleCron(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization") || "";
  const bearer = authHeader.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();

  if (!secret || bearer !== secret) {
    return NextResponse.json(
      { success: false, error: { message: "Não autorizado." } },
      { status: 401 },
    );
  }

  const ttlDays = Math.max(
    30,
    Number(request.nextUrl.searchParams.get("ttl_days") || 90),
  );

  const marked = await markStaleEntries(ttlDays);

  return NextResponse.json({
    success: true,
    markedStale: marked,
    ttlDays,
  });
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
