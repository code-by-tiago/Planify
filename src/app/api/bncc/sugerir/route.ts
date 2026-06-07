import { NextRequest, NextResponse } from "next/server";
import { requireApiPremiumAccess } from "../../../../server/auth/api-access";
import {
  extractConteudosFromPayload,
  suggestBnccByConteudos,
} from "../../../../server/bncc/bncc-suggestion-engine";
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

    const conteudoLines = extractConteudosFromPayload(payload || {});
    const result = await suggestBnccByConteudos(payload || {});

    // #region agent log
    fetch("http://127.0.0.1:7616/ingest/e1530077-9aac-4460-b700-4c831c23c281", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "920c67",
      },
      body: JSON.stringify({
        sessionId: "920c67",
        runId: "bncc-multi-conteudo",
        hypothesisId: "H1,H2",
        location: "bncc/sugerir/route.ts:POST",
        message: "bncc suggest conteudos parsed",
        data: {
          conteudoLinesCount: conteudoLines.length,
          conteudoLinesSample: conteudoLines.slice(0, 6),
          groupsCount: Array.isArray(result.conteudos) ? result.conteudos.length : 0,
          skillsTotal: (result.habilidades || []).length,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
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
