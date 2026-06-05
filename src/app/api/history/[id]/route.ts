import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "../../../../server/auth/api-access";
import { deleteHistoryItemFromDB } from "../../../../server/history/history-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

function errorResponse(message: string, status = 500, details?: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        details,
      },
    },
    { status },
  );
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const auth = await requireApiAuthenticated(request);
    if (!auth.ok) return auth.response;

    const { id } = await context.params;
    const userId = auth.access.user!.id;

    if (!id) {
      return errorResponse("ID do item não informado.", 400);
    }

    await deleteHistoryItemFromDB({ id, userId });

    return NextResponse.json(
      {
        success: true,
        data: {
          id,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao remover histórico no Supabase.";

    return errorResponse(
      "Não foi possível remover o item do histórico no Supabase.",
      500,
      message,
    );
  }
}
