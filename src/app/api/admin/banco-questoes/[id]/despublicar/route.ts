import { NextRequest, NextResponse } from "next/server";
import { unpublishFromCommunity } from "@/server/banco-questoes/question-bank-db-service";
import { requireAdminApi } from "@/server/auth/admin-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const gate = await requireAdminApi(_request);
  if (!gate.ok) return gate.response;

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Informe o id da questão." } },
      { status: 400 },
    );
  }

  try {
    const item = await unpublishFromCommunity(id);
    return NextResponse.json({ success: true, item });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao despublicar questão.";
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 },
    );
  }
}
