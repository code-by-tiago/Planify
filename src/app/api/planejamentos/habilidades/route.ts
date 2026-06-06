import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import { suggestBnccByConteudos } from "../../../../server/bncc/bncc-suggestion-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = await request.json();
    const result = await suggestBnccByConteudos(payload || {});

    return NextResponse.json({
      success: true,
      ok: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: {
          message:
            error instanceof Error
              ? error.message
              : "Não foi possível sugerir habilidades BNCC.",
        },
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    ok: true,
    message:
      "Rota de sugestão BNCC ativa. Use POST com etapa, anoSerie, componenteCurricular e conteudos.",
  });
}
