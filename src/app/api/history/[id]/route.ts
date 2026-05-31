import { NextRequest, NextResponse } from "next/server";
import { deleteHistoryItemFromDB } from "../../../../server/history/history-db-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const userId = getUserIdFromRequest(request);

    if (!id) {
      return errorResponse("ID do item não informado.", 400);
    }

    await deleteHistoryItemFromDB({
      id,
      userId,
    });

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
