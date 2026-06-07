import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import { suggestBnccByConteudos } from "../../../../server/bncc/bncc-suggestion-engine";
import { filterExtractedBnccByStage } from "../../../../server/bncc/bncc-stage-filter";
import { validateBnccSuggestionPayload } from "../../../../server/planejamentos/planning-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireApiPremiumAccess(request);
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;

    if (!payload || typeof payload !== "object") {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: { message: "Corpo da requisição inválido." },
        },
        { status: 400 },
      );
    }
    const validationError = validateBnccSuggestionPayload(payload);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: { message: validationError },
        },
        { status: 400 },
      );
    }

    const result = await suggestBnccByConteudos(payload || {});
    const etapa = String(payload?.etapa || "").trim();
    const anoSerie = String(payload?.anoSerie || payload?.serie || "").trim();
    const habilidades = result.habilidades || [];
    const filtered = filterExtractedBnccByStage(
      {
        codes: habilidades.map((skill) => skill.codigo),
        skills: habilidades,
      },
      etapa,
      anoSerie,
    );

    return NextResponse.json({
      success: true,
      ok: true,
      ...result,
      habilidades: filtered.skills,
      sugeridas: filtered.skills,
      skills: filtered.skills,
      items: filtered.skills,
      total: filtered.skills.length,
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
