import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import { getBnccChallengeQuestions } from "@/server/community/community-bncc-challenge-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: { message } }, { status });
}

export async function GET(request: NextRequest) {
  const access = await requireApiPremiumAccess(request);
  if (!access.ok) return access.response;

  const subject = request.nextUrl.searchParams.get("subject") || undefined;

  try {
    const result = await getBnccChallengeQuestions({ subject });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Não foi possível montar o desafio BNCC.",
      500,
    );
  }
}
