import { NextRequest, NextResponse } from "next/server";
import { publishToCommunity } from "@/server/banco-questoes/question-bank-db-service";
import { requireApiPremiumAccess } from "@/server/auth/api-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { questionId?: string };

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Usuário não autenticado." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as Body | null;
  const questionId = String(body?.questionId || "").trim();
  if (!questionId) {
    return NextResponse.json(
      { ok: false, message: "Informe questionId." },
      { status: 400 },
    );
  }

  try {
    const item = await publishToCommunity(userId, questionId);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao publicar questão.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
