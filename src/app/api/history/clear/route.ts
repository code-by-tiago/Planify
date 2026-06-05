import { NextRequest, NextResponse } from "next/server";
import { requireApiAuthenticated } from "../../../../server/auth/api-access";
import { clearHistoryItemsFromDB } from "../../../../server/history/history-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireApiAuthenticated(request);
    if (!auth.ok) return auth.response;

    const userId = auth.access.user!.id;

    await clearHistoryItemsFromDB({ userId });

    return NextResponse.json(
      {
        success: true,
        data: {
          cleared: true,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao limpar histórico no Supabase.";

    return errorResponse(
      "Não foi possível limpar o histórico no Supabase.",
      500,
      message,
    );
  }
}
