import { NextRequest, NextResponse } from "next/server";
import { upsertUserQuestion } from "@/server/banco-questoes/question-bank-db-service";
import { requireApiPremiumAccess } from "@/server/auth/api-access";
import type { QuestionBankItem } from "@/types/question-bank";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PutBody = {
  item?: QuestionBankItem;
};

export async function PUT(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Usuário não autenticado." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => null)) as PutBody | null;
  if (!body?.item?.enunciado?.trim()) {
    return NextResponse.json(
      { ok: false, message: "Questão inválida." },
      { status: 400 },
    );
  }

  try {
    const { item, duplicate } = await upsertUserQuestion(userId, body.item);
    return NextResponse.json({ ok: true, item, duplicate });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar questão.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
