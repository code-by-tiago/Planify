import { NextRequest, NextResponse } from "next/server";
import { clearHistoryItemsFromDB } from "../../../../server/history/history-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getUserIdFromRequest(request: NextRequest): string | null {
  const userId = request.headers.get("x-planify-user-id");

  if (!userId || userId === "local") {
    return null;
  }

  return userId;
}

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
    const userId = getUserIdFromRequest(request);

    await clearHistoryItemsFromDB({
      userId,
    });

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
