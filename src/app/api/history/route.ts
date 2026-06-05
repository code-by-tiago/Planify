import { NextRequest, NextResponse } from "next/server";
import type { HistoryItem } from "../../../types/history";
import { requireApiAuthenticated } from "../../../server/auth/api-access";
import {
  listHistoryItemsFromDB,
  saveHistoryItemToDB,
} from "../../../server/history/history-db-service";

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

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuthenticated(request);
    if (!auth.ok) return auth.response;

    const userId = auth.access.user!.id;
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number(limitParam) : 50;

    const items = await listHistoryItemsFromDB({
      userId,
      limit,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          items,
          mode: "user",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar histórico no Supabase.";

    return errorResponse(
      "Não foi possível listar o histórico no Supabase.",
      500,
      message,
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiAuthenticated(request);
    if (!auth.ok) return auth.response;

    const userId = auth.access.user!.id;
    const body = (await request.json()) as { item?: HistoryItem };

    if (!body.item) {
      return errorResponse("Item do histórico não enviado.", 400);
    }

    const saved = await saveHistoryItemToDB({
      userId,
      item: body.item,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          item: saved,
          mode: "user",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao salvar histórico no Supabase.";

    return errorResponse(
      "Não foi possível salvar o histórico no Supabase.",
      500,
      message,
    );
  }
}
