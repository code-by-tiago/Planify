import { NextRequest, NextResponse } from "next/server";
import {
  CORPUS_AUTO_APPROVE_THRESHOLD,
  CORPUS_SYNC_MIN_QUALITY,
  syncCorpusCandidates,
} from "@/server/corpus/sync-corpus-candidates";

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

  const limit = Math.max(
    0,
    Number(request.nextUrl.searchParams.get("limit") || 0),
  );

  const stats = await syncCorpusCandidates({
    minQuality: CORPUS_SYNC_MIN_QUALITY,
    autoApproveThreshold: CORPUS_AUTO_APPROVE_THRESHOLD,
    limit,
    dryRun: false,
  });

  return NextResponse.json({
    success: true,
    minQuality: CORPUS_SYNC_MIN_QUALITY,
    autoApproveThreshold: CORPUS_AUTO_APPROVE_THRESHOLD,
    stats,
  });
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
