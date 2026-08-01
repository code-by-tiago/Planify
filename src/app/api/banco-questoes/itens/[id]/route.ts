import { NextRequest, NextResponse } from "next/server";
import { deleteUserQuestion } from "@/server/banco-questoes/question-bank-db-service";
import { requireApiPremiumAccess } from "@/server/auth/api-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireApiPremiumAccess(_request);
  if (!auth.ok) return auth.response;

  const userId = auth.access.user?.id;
  if (!userId) {
    return NextResponse.json(
      { ok: false, message: "Usuário não autenticado." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json(
      { ok: false, message: "Informe o id da questão." },
      { status: 400 },
    );
  }

  try {
    const removed = await deleteUserQuestion(userId, id);
    if (!removed) {
      return NextResponse.json(
        { ok: false, message: "Questão não encontrada." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir questão.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
