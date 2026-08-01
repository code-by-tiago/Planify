import { NextResponse } from "next/server";

export type GenerationErrorCode =
  | "insufficient_credits"
  | "daily_limit_reached"
  | "generation_in_progress"
  | "offline"
  | "server_error"
  | "timeout"
  | "validation_error";

export type GenerationErrorBody = {
  ok: false;
  code?: GenerationErrorCode;
  message: string;
  retryable?: boolean;
  meta?: Record<string, unknown>;
};

export function jsonGenerationError(
  code: GenerationErrorCode,
  message: string,
  status: number,
  extra?: { retryable?: boolean; meta?: Record<string, unknown> },
): NextResponse<GenerationErrorBody> {
  return NextResponse.json(
    {
      ok: false as const,
      code,
      message,
      retryable: extra?.retryable,
      meta: extra?.meta,
    },
    { status },
  );
}

export function jsonGenerationValidationError(message: string): NextResponse<GenerationErrorBody> {
  return jsonGenerationError("validation_error", message, 400, { retryable: false });
}

export function jsonGenerationServerError(
  message: string,
  extra?: { retryable?: boolean; meta?: Record<string, unknown> },
): NextResponse<GenerationErrorBody> {
  return jsonGenerationError("server_error", message, 502, {
    retryable: extra?.retryable ?? true,
    meta: extra?.meta,
  });
}

/** Planning routes use `success` / `error` shape — helper keeps code aligned. */
export function jsonPlanningError(
  message: string,
  status: number,
  code?: GenerationErrorCode,
  extra?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      ...(code ? { code } : {}),
      error: { message },
      ...extra,
    },
    { status },
  );
}
