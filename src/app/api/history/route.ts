import { NextRequest, NextResponse } from "next/server";
import type { HistoryItem } from "../../../types/history";
import {
  listHistoryItemsFromDB,
  saveHistoryItemToDB,
} from "../../../server/history/history-db-service";

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

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
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
          mode: userId ? "user" : "admin-local",
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
    const userId = getUserIdFromRequest(request);
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
          mode: userId ? "user" : "admin-local",
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
