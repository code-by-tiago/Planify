import { NextRequest, NextResponse } from "next/server";
import { incrementUsageCount } from "@/server/banco-questoes/question-bank-db-service";
import { requireApiPremiumAccess } from "@/server/auth/api-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { questionId?: string };

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as Body | null;
  const questionId = String(body?.questionId || "").trim();
  if (!questionId) {
    return NextResponse.json(
      { ok: false, message: "Informe questionId." },
      { status: 400 },
    );
  }

  try {
    await incrementUsageCount(questionId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
