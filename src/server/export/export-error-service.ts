import { NextResponse } from "next/server";
import {
  jsonGenerationError,
  type GenerationErrorCode,
} from "@/server/generation/generation-api-contract";
import { logOperationalEvent } from "@/server/telemetry/operational-telemetry";

export type ExportErrorContext = {
  surface: string;
  toolTipo?: string;
};

export function mapExportError(
  error: unknown,
  statusHint?: number,
): { code: GenerationErrorCode; message: string; status: number; retryable: boolean } {
  const status = statusHint ?? 502;
  const message =
    error instanceof Error ? error.message : "Não foi possível concluir a exportação.";

  if (status === 401 || message.toLowerCase().includes("login")) {
    return {
      code: "validation_error",
      message: "Faça login e conecte sua conta Google.",
      status: 401,
      retryable: false,
    };
  }

  if (status === 413 || message.toLowerCase().includes("too large")) {
    return {
      code: "validation_error",
      message: "Arquivo muito grande para exportar.",
      status: 413,
      retryable: false,
    };
  }

  if (status === 503 || message.toLowerCase().includes("não configurada")) {
    return {
      code: "server_error",
      message: "Integração de exportação indisponível no momento.",
      status: 503,
      retryable: true,
    };
  }

  if (status === 504 || message.toLowerCase().includes("timeout")) {
    return {
      code: "timeout",
      message: "A exportação demorou demais. Tente novamente.",
      status: 504,
      retryable: true,
    };
  }

  if (status >= 500 || status === 502) {
    return {
      code: "server_error",
      message: "Exportação falhou — tente novamente em instantes.",
      status: status >= 500 ? status : 502,
      retryable: true,
    };
  }

  return {
    code: "validation_error",
    message,
    status: status >= 400 ? status : 400,
    retryable: false,
  };
}

export function logExportFailure(
  context: ExportErrorContext,
  error: unknown,
  statusHint?: number,
): ReturnType<typeof mapExportError> {
  const mapped = mapExportError(error, statusHint);

  logOperationalEvent({
    eventType: "export_failed",
    toolTipo: context.toolTipo ?? context.surface,
    ok: false,
    errorCode: mapped.code,
    metadata: {
      message: mapped.message,
      surface: context.surface,
    },
  });

  return mapped;
}

/** Google/DOCX routes using `{ success, error }` shape */
export function jsonExportErrorResponse(
  error: unknown,
  context: ExportErrorContext,
  statusHint?: number,
): NextResponse {
  const mapped = logExportFailure(context, error, statusHint);

  return NextResponse.json(
    {
      success: false,
      code: mapped.code,
      error: { message: mapped.message },
      retryable: mapped.retryable,
    },
    { status: mapped.status },
  );
}

/** Routes using `{ ok: false }` shape */
export function jsonExportGenerationError(
  error: unknown,
  context: ExportErrorContext,
  statusHint?: number,
): NextResponse {
  const mapped = logExportFailure(context, error, statusHint);
  return jsonGenerationError(mapped.code, mapped.message, mapped.status, {
    retryable: mapped.retryable,
  });
}
