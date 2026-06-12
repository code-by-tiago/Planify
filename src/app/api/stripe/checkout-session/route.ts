import { NextRequest, NextResponse } from "next/server";
import { getCheckoutSessionPublicSummary } from "../../../../server/stripe/checkout-session-lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id")?.trim();

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "session_id ausente." },
      },
      { status: 400 },
    );
  }

  try {
    const summary = await getCheckoutSessionPublicSummary(sessionId);

    if (!summary) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Sessão de checkout não encontrada ou expirada." },
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível consultar a sessão de checkout.",
        },
      },
      { status: 500 },
    );
  }
}
