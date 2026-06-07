import { NextRequest, NextResponse } from "next/server";
import {
  applyLessonSimulatorUsageCookies,
  checkLessonSimulatorRateLimit,
  markLessonSimulatorUsage,
} from "../../../../server/public/lesson-simulator-rate-limit";
import {
  generateLessonSimulatorSkeleton,
  LessonSimulatorError,
  validateLessonSimulatorTheme,
} from "../../../../server/public/lesson-simulator-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2048;

const GENERIC_FAILURE_MESSAGE =
  "Não foi possível gerar o esqueleto. Tente novamente em alguns instantes.";

function buildErrorResponse(
  request: NextRequest,
  fingerprint: string,
  usedAt: number | null,
  status: number,
  code: string,
  message: string,
  extra?: Record<string, unknown>,
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error: { code, message },
      ...extra,
    },
    { status },
  );

  if (usedAt !== null) {
    applyLessonSimulatorUsageCookies(request, response, fingerprint, usedAt);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const state = await checkLessonSimulatorRateLimit(request);

  return NextResponse.json({
    success: true,
    limited: state.limited,
    retryAfterMs: state.retryAfterMs ?? null,
  });
}

export async function POST(request: NextRequest) {
  const rateState = await checkLessonSimulatorRateLimit(request);

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

  let reservedAt: number | null = null;

  try {
    const rawBody = await request.text();

    if (rawBody.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_input",
            message: "Requisição inválida.",
          },
        },
        { status: 400 },
      );
    }

    let body: { theme?: unknown };

    try {
      body = JSON.parse(rawBody) as { theme?: unknown };
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_input",
            message: "Requisição inválida.",
          },
        },
        { status: 400 },
      );
    }

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
    reservedAt = await markLessonSimulatorUsage(request, rateState.fingerprint);

    const skeleton = await generateLessonSimulatorSkeleton(theme);

    const response = NextResponse.json({
      success: true,
      data: { skeleton },
    });

    applyLessonSimulatorUsageCookies(
      request,
      response,
      rateState.fingerprint,
      reservedAt,
    );

    return response;
  } catch (error) {
    if (error instanceof LessonSimulatorError) {
      console.error("[lesson-simulator] generation failed:", error.code);

      return buildErrorResponse(
        request,
        rateState.fingerprint,
        reservedAt,
        500,
        "generation_failed",
        GENERIC_FAILURE_MESSAGE,
      );
    }

    const rawMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao gerar esqueleto de aula.";

    console.error("[lesson-simulator] unexpected failure:", rawMessage);

    if (/GEMINI_API_KEY/i.test(rawMessage)) {
      return buildErrorResponse(
        request,
        rateState.fingerprint,
        reservedAt,
        503,
        "missing_api_key",
        "Simulador temporariamente indisponível. Tente novamente em breve.",
      );
    }

    return buildErrorResponse(
      request,
      rateState.fingerprint,
      reservedAt,
      500,
      "generation_failed",
      GENERIC_FAILURE_MESSAGE,
    );
  }
}
