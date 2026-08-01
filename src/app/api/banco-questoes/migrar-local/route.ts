import { NextRequest, NextResponse } from "next/server";
import { migrateLocalQuestions } from "@/server/banco-questoes/question-bank-db-service";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import type { QuestionBankItem } from "@/types/question-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { items?: QuestionBankItem[] };

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
  const items = Array.isArray(body?.items) ? body.items : [];

  if (!items.length) {
    return NextResponse.json(
      { ok: false, message: "Nenhuma questão para migrar." },
      { status: 400 },
    );
  }

  try {
    const result = await migrateLocalQuestions(userId, items);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro na migração.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
