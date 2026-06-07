import { NextRequest, NextResponse } from "next/server";
import {
  checkLessonSimulatorRateLimit,
  recordLessonSimulatorUsage,
} from "../../../../server/public/lesson-simulator-rate-limit";
import {
  generateLessonSimulatorSkeleton,
  validateLessonSimulatorTheme,
} from "../../../../server/public/lesson-simulator-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const state = checkLessonSimulatorRateLimit(request);

  return NextResponse.json({
    success: true,
    limited: state.limited,
    retryAfterMs: state.retryAfterMs ?? null,
  });
}

export async function POST(request: NextRequest) {
  const rateState = checkLessonSimulatorRateLimit(request);

  if (rateState.limited) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "rate_limited",
          message:
            "Você atingiu o limite do simulador gratuito! Crie sua conta para ter acesso ilimitado ao painel completo.",
        },
        retryAfterMs: rateState.retryAfterMs ?? null,
      },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as { theme?: unknown };
    const validationError = validateLessonSimulatorTheme(body.theme);

    if (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_input",
            message: validationError,
          },
        },
        { status: 400 },
      );
    }

    const theme = String(body.theme).trim();
    const skeleton = await generateLessonSimulatorSkeleton(theme);

    const response = NextResponse.json({
      success: true,
      data: { skeleton },
    });

    recordLessonSimulatorUsage(request, response, rateState.fingerprint);

    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao gerar esqueleto de aula.";

    if (/GEMINI_API_KEY/i.test(message)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "missing_api_key",
            message: "Simulador temporariamente indisponível. Tente novamente em breve.",
          },
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "generation_failed",
          message,
        },
      },
      { status: 500 },
    );
  }
}
