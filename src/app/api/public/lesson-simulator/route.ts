import { NextRequest, NextResponse } from "next/server";
import {
  applyLessonSimulatorUsageCookies,
  checkLessonSimulatorRateLimit,
  markLessonSimulatorUsage,
} from "../../../../server/public/lesson-simulator-rate-limit";
import {
  generateLessonSimulatorLista,
  LessonSimulatorError,
  validateLessonSimulatorEducation,
  validateLessonSimulatorTheme,
} from "../../../../server/public/lesson-simulator-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BODY_BYTES = 4096;

const GENERIC_FAILURE_MESSAGE =
  "Não foi possível gerar a lista de atividades. Tente novamente em alguns instantes.";

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
            "Você já usou seu teste gratuito! Crie sua conta para gerar listas e materiais ilimitados.",
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

    let body: {
      theme?: unknown;
      etapa?: unknown;
      anoSerie?: unknown;
      areaConhecimento?: unknown;
      componente?: unknown;
    };

    try {
      body = JSON.parse(rawBody) as typeof body;
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

    const educationResult = validateLessonSimulatorEducation({
      etapa: typeof body.etapa === "string" ? body.etapa : "",
      anoSerie: typeof body.anoSerie === "string" ? body.anoSerie : "",
      areaConhecimento:
        typeof body.areaConhecimento === "string" ? body.areaConhecimento : "",
      componente: typeof body.componente === "string" ? body.componente : "",
    });

    if (!educationResult.ok) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_input",
            message: educationResult.message,
          },
        },
        { status: 400 },
      );
    }

    const theme = String(body.theme).trim();
    reservedAt = await markLessonSimulatorUsage(request, rateState.fingerprint);

    const result = await generateLessonSimulatorLista(theme, educationResult.education);

    const response = NextResponse.json({
      success: true,
      data: {
        lista: result.lista,
        html: result.html,
        pdfBase64: result.pdfBase64,
        filename: result.filename,
      },
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

      const message =
        error.code === "pdf_failed"
          ? "A lista foi gerada, mas o PDF falhou. Tente novamente em alguns instantes."
          : GENERIC_FAILURE_MESSAGE;

      return buildErrorResponse(
        request,
        rateState.fingerprint,
        reservedAt,
        500,
        error.code === "pdf_failed" ? "pdf_failed" : "generation_failed",
        message,
      );
    }

    const rawMessage =
      error instanceof Error
        ? error.message
        : "Erro desconhecido ao gerar lista de atividades.";

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
