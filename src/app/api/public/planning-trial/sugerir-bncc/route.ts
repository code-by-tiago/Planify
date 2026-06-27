import { NextRequest, NextResponse } from "next/server";
import { suggestBnccByConteudos } from "@/server/bncc/bncc-suggestion-engine";
import { applyStageFilterToBnccSuggestionResult } from "@/server/bncc/bncc-suggestion-response";
import { validateBnccSuggestionPayload } from "@/server/planejamentos/planning-validation";
import { checkPlanningTrialBnccRateLimit } from "@/server/public/planning-trial-bncc-rate-limit";
import { isPlanningTrialRequestOriginAllowed } from "@/server/public/planning-trial-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32_000;

export async function POST(request: NextRequest) {
  if (!isPlanningTrialRequestOriginAllowed(request)) {
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: { message: "Origem da requisição não permitida." },
      },
      { status: 403 },
    );
  }

  const rateState = checkPlanningTrialBnccRateLimit(request);
  if (rateState.limited) {
    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: {
          message: "Muitas sugestões em pouco tempo. Aguarde um momento e tente novamente.",
        },
      },
      { status: 429 },
    );
  }

  try {
    const rawBody = await request.text();

    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          ok: false,
          error: { message: "Requisição muito grande." },
        },
        { status: 413 },
      );
    }

    const payload = (JSON.parse(rawBody) || null) as Record<string, unknown> | null;

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
    const filtered = applyStageFilterToBnccSuggestionResult(result, etapa, anoSerie);

    return NextResponse.json({
      success: true,
      ok: true,
      ...filtered,
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
